import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { HandoverError, lockRental } from "@/lib/handover";
import type { CollectionIssueCategory, CollectionIssueOutcome, Prisma } from "@/lib/generated/prisma/client";

type Evidence = { path: string; mimeType: string };

async function actorFor(role: "RENTER" | "OWNER") {
  const actor = await getSession();
  if (!actor || actor.role !== role) {
    throw new HandoverError("You are not authorized to manage this issue.");
  }
  return actor;
}

async function audit(
  tx: Prisma.TransactionClient,
  userId: string,
  issueId: string,
  action: string,
  details: object,
) {
  await tx.auditLog.create({
    data: { userId, entity: "CollectionIssue", entityId: issueId, action, details: JSON.stringify(details) },
  });
}

async function notify(
  tx: Prisma.TransactionClient,
  userId: string,
  rentalId: string,
  type: string,
  title: string,
  message: string,
) {
  await tx.notification.create({ data: { userId, rentalId, type, title, message } });
}

export async function assertRenterCanReport(rentalId: string) {
  const actor = await actorFor("RENTER");
  const rental = await prisma.rental.findFirst({
    where: { id: rentalId, renterId: actor.userId, status: "APPROVED" },
    select: { id: true },
  });
  if (!rental) throw new HandoverError("This booking is not available for reporting an issue.");
}

export async function reportCollectionIssue(input: {
  id: string;
  rentalId: string;
  category: CollectionIssueCategory;
  description: string;
  evidence: Evidence[];
}) {
  const actor = await actorFor("RENTER");
  await prisma.$transaction(async (tx) => {
    const rental = await lockRental(tx, input.rentalId);
    if (rental.renterId !== actor.userId || rental.status !== "APPROVED") {
      throw new HandoverError("This booking is not available for reporting an issue.");
    }
    const existing = await tx.collectionIssue.findFirst({
      where: { rentalId: rental.id, status: { in: ["OPEN", "PROPOSED"] } },
      select: { id: true },
    });
    if (existing) throw new HandoverError("This booking already has an unresolved device issue.");
    await tx.collectionIssue.create({
      data: {
        id: input.id,
        rentalId: rental.id,
        deviceId: rental.deviceId,
        category: input.category,
        description: input.description,
        evidence: { create: input.evidence },
      },
    });
    await audit(tx, actor.userId, input.id, "COLLECTION_ISSUE_REPORTED", { category: input.category });
    await notify(tx, rental.ownerId, rental.id, "COLLECTION_ISSUE_REPORTED", "Device issue reported",
      "The renter reported an issue before collection. Review the report and propose a resolution.");
  });
}

export async function proposeCollectionIssue(
  rentalId: string,
  issueId: string,
  outcome: CollectionIssueOutcome,
  replacementDeviceId: string | null,
) {
  const actor = await actorFor("OWNER");
  await prisma.$transaction(async (tx) => {
    const rental = await lockRental(tx, rentalId);
    if (rental.ownerId !== actor.userId || rental.status !== "APPROVED") {
      throw new HandoverError("This booking is not available for an issue proposal.");
    }
    const issue = await tx.collectionIssue.findFirst({
      where: { id: issueId, rentalId, status: "OPEN" },
      select: { id: true, deviceId: true },
    });
    if (!issue || issue.deviceId !== rental.deviceId) {
      throw new HandoverError("This issue is no longer available for a proposal.");
    }
    if (outcome === "REPLACE") {
      if (!replacementDeviceId || replacementDeviceId === rental.deviceId) {
        throw new HandoverError("Choose a different replacement device.");
      }
      const replacement = await tx.device.findFirst({
        where: { id: replacementDeviceId, ownerId: actor.userId, status: "AVAILABLE" },
        select: { id: true },
      });
      if (!replacement) throw new HandoverError("The replacement device is not available.");
    } else if (replacementDeviceId) {
      throw new HandoverError("A replacement device is only allowed for a replacement proposal.");
    }
    await tx.collectionIssue.update({
      where: { id: issue.id },
      data: { status: "PROPOSED", proposedOutcome: outcome, replacementDeviceId, proposedAt: new Date() },
    });
    await audit(tx, actor.userId, issue.id, "COLLECTION_ISSUE_PROPOSED", { outcome, replacementDeviceId });
    await notify(tx, rental.renterId, rentalId, "COLLECTION_ISSUE_PROPOSED", "Device issue resolution proposed",
      "The owner proposed a resolution. Review it in your booking.");
  });
}

export async function respondToCollectionIssue(
  rentalId: string,
  issueId: string,
  outcome: CollectionIssueOutcome,
  proposedAt: string,
  replacementDeviceId: string | null,
  accept: boolean,
) {
  const actor = await actorFor("RENTER");
  await prisma.$transaction(async (tx) => {
    const rental = await lockRental(tx, rentalId);
    if (rental.renterId !== actor.userId || rental.status !== "APPROVED") {
      throw new HandoverError("This booking is not available for an issue response.");
    }
    const issue = await tx.collectionIssue.findFirst({
      where: { id: issueId, rentalId, status: "PROPOSED" },
    });
    if (!issue || issue.proposedOutcome !== outcome || issue.proposedAt?.toISOString() !== proposedAt ||
        issue.replacementDeviceId !== replacementDeviceId ||
        issue.deviceId !== rental.deviceId) {
      throw new HandoverError("The proposal has changed. Refresh the booking before responding.");
    }

    if (!accept) {
      await tx.collectionIssue.update({
        where: { id: issue.id },
        data: { status: "OPEN", proposedOutcome: null, replacementDeviceId: null, proposedAt: null },
      });
      await audit(tx, actor.userId, issue.id, "COLLECTION_ISSUE_DECLINED", { outcome });
      await notify(tx, rental.ownerId, rentalId, "COLLECTION_ISSUE_DECLINED", "Issue proposal declined",
        "The renter declined your proposed resolution. Please review the issue and propose another outcome.");
      return;
    }

    let paymentReviewRequired = false;
    if (outcome === "REPLACE") {
      if (!issue.replacementDeviceId || issue.replacementDeviceId === rental.deviceId) {
        throw new HandoverError("The replacement proposal is invalid.");
      }
      const reserved = await tx.device.updateMany({
        where: { id: issue.replacementDeviceId, ownerId: rental.ownerId, status: "AVAILABLE" },
        data: { status: "UNAVAILABLE" },
      });
      if (reserved.count !== 1) {
        throw new HandoverError("The proposed replacement is no longer available. Ask the owner for a new proposal.");
      }
      await tx.rental.update({ where: { id: rentalId }, data: { deviceId: issue.replacementDeviceId } });
      await tx.handover.updateMany({
        where: { rentalId, type: "COLLECTION" },
        data: {
          status: "INITIATED",
          expiresAt: new Date(0),
          scannedAt: null,
          ownerConfirmedAt: null,
          renterConfirmedAt: null,
          verifiedAt: null,
        },
      });
    } else if (outcome === "CANCEL") {
      const existingPayment = await tx.transaction.findFirst({ where: { rentalId }, select: { id: true } });
      paymentReviewRequired = !!existingPayment;
      await tx.rental.update({ where: { id: rentalId }, data: { status: "CANCELLED" } });
      if (paymentReviewRequired) {
        const admins = await tx.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
        if (admins.length) {
          await tx.notification.createMany({
            data: admins.map((admin) => ({
              userId: admin.id, rentalId, type: "COLLECTION_ISSUE_PAYMENT_REVIEW",
              title: "Cancelled booking requires payment review",
              message: `Booking #${rentalId.slice(-6)} has existing transactions. Review payment and deposit handling manually.`,
            })),
          });
        }
      }
    }

    await tx.collectionIssue.update({
      where: { id: issue.id },
      data: { status: "RESOLVED", resolvedAt: new Date(), paymentReviewRequired },
    });
    await audit(tx, actor.userId, issue.id, "COLLECTION_ISSUE_AGREED", {
      outcome, replacementDeviceId: issue.replacementDeviceId, paymentReviewRequired,
    });
    const message = outcome === "REPLACE"
      ? "The renter agreed to the replacement at the original price and deposit. Generate a new collection QR."
      : outcome === "REPAIR"
        ? "The renter agreed the issue was resolved after reinspection. Collection can continue."
        : paymentReviewRequired
          ? "Both parties agreed to cancel. Existing transactions require manual payment and deposit review; no money was moved."
          : "Both parties agreed to cancel. No payment or deposit was moved.";
    await notify(tx, rental.ownerId, rentalId, "COLLECTION_ISSUE_AGREED", "Device issue resolution agreed", message);
    await notify(tx, rental.renterId, rentalId, "COLLECTION_ISSUE_AGREED", "Device issue resolution agreed", message);
  });
}
