"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  assertRenterCanReport,
  proposeCollectionIssue,
  reportCollectionIssue,
  respondToCollectionIssue,
} from "@/lib/collection-issues";
import { EvidenceError, removeEvidence, uploadEvidence, validateEvidence } from "@/lib/collection-issue-evidence";
import { HandoverError } from "@/lib/handover";
import { prisma } from "@/lib/prisma";

type State = { error: string } | { success: true } | null;
const categories = z.enum(["POWER", "FUNCTIONALITY", "PHYSICAL_DAMAGE", "MISSING_ACCESSORY", "OTHER"]);
const outcomes = z.enum(["REPLACE", "REPAIR", "CANCEL"]);

function refreshIssuePages(rentalId: string) {
  revalidatePath(`/renter/rentals/${rentalId}`);
  revalidatePath(`/owner/rentals/${rentalId}/issue`);
  revalidatePath("/renter/rentals");
  revalidatePath("/owner/rentals");
  revalidatePath("/owner/devices");
  revalidatePath("/renter/notifications");
  revalidatePath("/owner/notifications");
  revalidatePath("/admin/notifications");
  revalidatePath("/devices");
}

function actionError(error: unknown): { error: string } {
  if (error instanceof HandoverError || error instanceof EvidenceError) return { error: error.message };
  console.error("Collection issue action failed:", error instanceof Error ? error.name : "Unknown error");
  return { error: "Could not update the issue. Refresh the booking and try again." };
}

export async function reportIssue(rentalId: string, _state: State, form: FormData): Promise<State> {
  const parsed = z.object({
    category: categories,
    description: z.string().trim().min(10).max(2000),
  }).safeParse({ category: form.get("category"), description: form.get("description") });
  if (typeof rentalId !== "string" || !parsed.success) {
    return { error: "Choose a category and describe the issue in 10 to 2,000 characters." };
  }
  const entries = form.getAll("evidence");
  if (entries.some((entry) => !(entry instanceof File))) {
    return { error: "Invalid evidence file." };
  }
  const files = entries.filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const issueId = randomUUID();
  let uploaded: { path: string; mimeType: string }[] = [];
  try {
    await assertRenterCanReport(rentalId);
    const validated = await validateEvidence(files);
    uploaded = await uploadEvidence(rentalId, issueId, validated);
    await reportCollectionIssue({ id: issueId, rentalId, ...parsed.data, evidence: uploaded });
  } catch (error) {
    if (uploaded.length) {
      try {
        const saved = await prisma.collectionIssue.findUnique({ where: { id: issueId }, select: { id: true } });
        if (!saved) await removeEvidence(uploaded.map((item) => item.path));
      } catch (cleanupError) {
        console.error("Could not verify or clean up issue evidence:", cleanupError instanceof Error ? cleanupError.name : "Unknown error");
      }
    }
    return actionError(error);
  }
  refreshIssuePages(rentalId);
  return { success: true };
}

export async function proposeIssue(rentalId: string, issueId: string, _state: State, form: FormData): Promise<State> {
  const parsed = outcomes.safeParse(form.get("outcome"));
  const replacement = form.get("replacementDeviceId");
  if (typeof rentalId !== "string" || typeof issueId !== "string" || !parsed.success ||
      (replacement !== null && typeof replacement !== "string")) {
    return { error: "Choose a valid resolution." };
  }
  if (parsed.data === "REPAIR" && form.get("inspected") !== "confirmed") {
    return { error: "Confirm the repair and reinspection before proposing this outcome." };
  }
  try {
    await proposeCollectionIssue(rentalId, issueId, parsed.data, replacement || null);
  } catch (error) {
    return actionError(error);
  }
  refreshIssuePages(rentalId);
  return { success: true };
}

export async function respondToIssue(rentalId: string, issueId: string, _state: State, form: FormData): Promise<State> {
  const outcome = outcomes.safeParse(form.get("outcome"));
  const proposedAt = form.get("proposedAt");
  const replacement = form.get("replacementDeviceId");
  const response = form.get("response");
  if (typeof rentalId !== "string" || typeof issueId !== "string" || !outcome.success ||
      typeof proposedAt !== "string" || (replacement !== null && typeof replacement !== "string") ||
      (response !== "accept" && response !== "decline")) {
    return { error: "Invalid issue response. Refresh the booking and try again." };
  }
  if (response === "accept" && outcome.data === "REPAIR" && form.get("inspected") !== "confirmed") {
    return { error: "Confirm that you reinspected the repaired device before accepting." };
  }
  try {
    await respondToCollectionIssue(rentalId, issueId, outcome.data, proposedAt, replacement || null, response === "accept");
  } catch (error) {
    return actionError(error);
  }
  refreshIssuePages(rentalId);
  return { success: true };
}
