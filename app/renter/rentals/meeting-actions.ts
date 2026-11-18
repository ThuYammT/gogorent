"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRenter } from "@/lib/session";
import { MeetingPlanError } from "@/lib/booking-meetings";
import { updateReturnMeeting } from "@/lib/return-meetings";

export type MeetingFormState = { error?: string; success?: boolean };
export async function saveReturnMeeting(rentalId: string, _previous: MeetingFormState, form: FormData): Promise<MeetingFormState> {
  const renter = await requireRenter();
  try {
    await prisma.$transaction(tx => updateReturnMeeting(tx, rentalId, renter.id, form));
  } catch (error) {
    return { error: error instanceof MeetingPlanError ? error.message : "Could not save the return meeting. Please try again." };
  }
  for (const path of [`/renter/rentals/${rentalId}`, "/renter/rentals", "/owner/rentals", "/owner/notifications", "/admin/rentals"]) revalidatePath(path);
  return { success: true };
}
