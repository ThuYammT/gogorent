import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { HandoverType, Prisma } from "@/lib/generated/prisma/client";
import {
  createHandoverToken,
  hashHandoverToken,
  isHandoverTokenFormat,
} from "@/lib/handover-tokens";

export class HandoverError extends Error {}

async function lockRental(
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
          ? "The renter has scanned your Collection QR code. Collection confirmation is not yet available."
          : "The owner has successfully scanned your Return QR code. Please complete the return confirmation.",
      },
    });
  });
}
