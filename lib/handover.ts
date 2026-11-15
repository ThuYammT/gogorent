import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { HandoverType, Prisma } from "@/lib/generated/prisma/client";
import {
  createHandoverToken,
  hashHandoverToken,
  isHandoverTokenFormat,
} from "@/lib/handover-tokens";

export class HandoverError extends Error {}

export async function lockRental(
  transaction: Prisma.TransactionClient,
  rentalId: string,
) {
  await transaction.$queryRaw`SELECT "id" FROM "Rental" WHERE "id" = ${rentalId} FOR UPDATE`;
  const rental = await transaction.rental.findUnique({ where: { id: rentalId } });
  if (!rental) {
    throw new HandoverError("Booking not found.");
  }
  return rental;
}

export async function requireNoOpenCollectionIssue(
  transaction: Prisma.TransactionClient,
  rentalId: string,
) {
  const issue = await transaction.collectionIssue.findFirst({
    where: { rentalId, status: { in: ["OPEN", "PROPOSED"] } },
    select: { id: true },
  });
  if (issue) {
    throw new HandoverError("Resolve the reported device issue before continuing.");
  }
}

function requireEligible(status: string, type: HandoverType) {
  if (status !== (type === "COLLECTION" ? "APPROVED" : "ACTIVE")) {
    throw new HandoverError("Booking is not eligible for this handover.");
  }
}

function requireHandoverType(type: HandoverType) {
  if (type !== "COLLECTION" && type !== "RETURN") {
    throw new HandoverError("Invalid handover type.");
  }
}

export async function initiateHandover(rentalId: string, type: HandoverType) {
  requireHandoverType(type);
  const actor = await getSession();
  if (!actor) {
    throw new HandoverError("Authentication required.");
  }

  return prisma.$transaction(async (transaction) => {
    const rental = await lockRental(transaction, rentalId);
    const generatorId = type === "COLLECTION" ? rental.ownerId : rental.renterId;
    const generatorRole = type === "COLLECTION" ? "OWNER" : "RENTER";
    if (actor.userId !== generatorId || actor.role !== generatorRole) {
      throw new HandoverError("You are not authorized to generate this code.");
    }
    requireEligible(rental.status, type);

    const existing = await transaction.handover.findUnique({
      where: { rentalId_type: { rentalId, type } },
    });
    const now = new Date();
    if (existing && (existing.status !== "INITIATED" || existing.expiresAt > now)) {
      throw new HandoverError("The current handover code is still valid or has already been scanned.");
    }

    const generated = createHandoverToken(now);
    const handover = await transaction.handover.upsert({
      where: { rentalId_type: { rentalId, type } },
      create: {
        rentalId,
        type,
        tokenHash: generated.tokenHash,
        expiresAt: generated.expiresAt,
      },
      update: {
        tokenHash: generated.tokenHash,
        expiresAt: generated.expiresAt,
      },
    });

    await transaction.auditLog.create({
      data: {
        userId: actor.userId,
        action: `${type}_QR_GENERATED`,
        entity: "Handover",
        entityId: handover.id,
      },
    });
    await transaction.notification.create({
      data: {
        userId: type === "COLLECTION" ? rental.renterId : rental.ownerId,
        rentalId,
        type: `${type}_QR_GENERATED`,
        title: type === "COLLECTION" ? "Collection QR generated" : "Return QR generated",
        message: type === "COLLECTION"
          ? "The owner has generated a Collection QR code. Open your booking to scan it at collection."
          : "The renter has generated a Return QR code. Please scan it to verify the device return.",
      },
    });
    return { token: generated.token, expiresAt: generated.expiresAt };
  });
}

export async function verifyHandover(
  rentalId: string,
  type: HandoverType,
  token: string,
) {
  requireHandoverType(type);
  const actor = await getSession();
  if (!actor) {
    throw new HandoverError("Authentication required.");
  }
  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    select: { ownerId: true, renterId: true },
  });
  const scannerId = type === "COLLECTION" ? rental?.renterId : rental?.ownerId;
  const scannerRole = type === "COLLECTION" ? "RENTER" : "OWNER";
  if (!rental || actor.userId !== scannerId || actor.role !== scannerRole) {
    throw new HandoverError("You are not authorized to scan this code.");
  }

  const limits = await prisma.$queryRaw<{ attempts: number }[]>`
    INSERT INTO "HandoverVerificationLimit" ("rentalId", "userId", "windowStart", "attempts")
    VALUES (${rentalId}, ${actor.userId}, CURRENT_TIMESTAMP, 1)
    ON CONFLICT ("rentalId", "userId") DO UPDATE SET
      "attempts" = CASE
        WHEN "HandoverVerificationLimit"."windowStart" <= CURRENT_TIMESTAMP - INTERVAL '5 minutes'
        THEN 1 ELSE "HandoverVerificationLimit"."attempts" + 1 END,
      "windowStart" = CASE
        WHEN "HandoverVerificationLimit"."windowStart" <= CURRENT_TIMESTAMP - INTERVAL '5 minutes'
        THEN CURRENT_TIMESTAMP ELSE "HandoverVerificationLimit"."windowStart" END
    RETURNING "attempts"
  `;
  if (limits.length !== 1 || limits[0].attempts > 10) {
    throw new HandoverError("Too many verification attempts. Please try again later.");
  }
  if (!isHandoverTokenFormat(token)) {
    throw new HandoverError("Invalid QR code.");
  }

  await prisma.$transaction(async (transaction) => {
    const rental = await lockRental(transaction, rentalId);
    const scannerId = type === "COLLECTION" ? rental.renterId : rental.ownerId;
    const scannerRole = type === "COLLECTION" ? "RENTER" : "OWNER";
    if (actor.userId !== scannerId || actor.role !== scannerRole) {
      throw new HandoverError("You are not authorized to scan this code.");
    }
    requireEligible(rental.status, type);
    const now = new Date();
    const updated = await transaction.handover.updateMany({
      where: {
        rentalId,
        type,
        tokenHash: hashHandoverToken(token),
        status: "INITIATED",
        expiresAt: { gt: now },
      },
      data: { status: "QR_SCANNED", scannedAt: now },
    });
    if (updated.count !== 1) {
      throw new HandoverError("QR code is invalid, expired or already used.");
    }

    const handover = await transaction.handover.findUniqueOrThrow({
      where: { rentalId_type: { rentalId, type } },
      select: { id: true },
    });
    await transaction.auditLog.create({
      data: {
        userId: actor.userId,
        action: `${type}_QR_SCANNED`,
        entity: "Handover",
        entityId: handover.id,
      },
    });
    await transaction.notification.create({
      data: {
        userId: type === "COLLECTION" ? rental.ownerId : rental.renterId,
        rentalId,
        type: `${type}_QR_SCANNED`,
        title: type === "COLLECTION" ? "Collection QR scanned" : "Return QR scanned",
        message: type === "COLLECTION"
          ? "The renter has scanned your Collection QR code and can now confirm receipt and condition."
          : "The owner has successfully scanned your Return QR code. Please complete the return confirmation.",
      },
    });
  });
}

export async function confirmCollection(rentalId: string, listedCondition: string) {
  const actor = await getSession();
  if (!actor || actor.role !== "RENTER") {
    throw new HandoverError("You are not authorized to confirm this collection.");
  }

  await prisma.$transaction(async (transaction) => {
    const rental = await lockRental(transaction, rentalId);
    if (rental.renterId !== actor.userId) {
      throw new HandoverError("You are not authorized to confirm this collection.");
    }
    if (rental.status !== "APPROVED") {
      throw new HandoverError("This booking is not awaiting collection confirmation.");
    }
    await requireNoOpenCollectionIssue(transaction, rentalId);

    const handover = await transaction.handover.findUnique({
      where: { rentalId_type: { rentalId, type: "COLLECTION" } },
      select: { id: true, status: true, scannedAt: true },
    });
    if (!handover || handover.status !== "QR_SCANNED" || !handover.scannedAt) {
      throw new HandoverError("Scan the collection QR code before confirming receipt.");
    }
    const existingPayment = await transaction.transaction.findFirst({
      where: { rentalId, type: "RENTAL_PAYMENT" },
      select: { id: true },
    });
    if (existingPayment) {
      throw new HandoverError("A payment record already exists for this booking. Contact support.");
    }

    await transaction.$queryRaw`SELECT "id" FROM "Device" WHERE "id" = ${rental.deviceId} FOR UPDATE`;
    const device = await transaction.device.findUnique({
      where: { id: rental.deviceId },
      select: { ownerId: true, condition: true, status: true },
    });
    if (!device || device.ownerId !== rental.ownerId || device.status !== "UNAVAILABLE") {
      throw new HandoverError("This device is not available for collection. Contact the owner.");
    }
    if (device.condition !== listedCondition) {
      throw new HandoverError("The listed device condition changed. Refresh the booking and inspect it again.");
    }

    const now = new Date();
    await transaction.handover.update({
      where: { id: handover.id },
      data: { status: "VERIFIED", renterConfirmedAt: now, verifiedAt: now },
    });
    await transaction.rental.update({
      where: { id: rentalId },
      data: { status: "ACTIVE", pickedUpAt: now },
    });
    await transaction.device.update({
      where: { id: rental.deviceId },
      data: { status: "RENTED" },
    });
    await transaction.transaction.create({
      data: {
        rentalId,
        type: "RENTAL_PAYMENT",
        amount: rental.totalAmount,
        status: "PENDING",
      },
    });
    await transaction.auditLog.create({
      data: {
        userId: actor.userId,
        action: "COLLECTION_CONFIRMED",
        entity: "Handover",
        entityId: handover.id,
        details: JSON.stringify({ condition: device.condition, received: true }),
      },
    });
    await transaction.notification.create({
      data: {
        userId: rental.ownerId,
        rentalId,
        type: "COLLECTION_CONFIRMED",
        title: "Device collection confirmed",
        message: "The renter confirmed receipt and the listed device condition. The rental is active and payment is pending.",
      },
    });
  });
}
