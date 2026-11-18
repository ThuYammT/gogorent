import type { Prisma } from "@/lib/generated/prisma/client";

export class ListingModerationError extends Error {}

export async function removeMarketplaceListing(
  tx: Prisma.TransactionClient,
  input: { deviceId: string; adminId: string; reason: string },
) {
  const reason = input.reason.trim();
  if (!reason || reason.length > 1000) throw new ListingModerationError("Provide a reason between 1 and 1,000 characters.");

  await tx.$queryRaw`SELECT "id" FROM "Device" WHERE "id" = ${input.deviceId} FOR UPDATE`;
  const device = await tx.device.findUnique({ where: { id: input.deviceId } });
  if (!device) throw new ListingModerationError("Listing not found.");
  if (device.status === "REJECTED") throw new ListingModerationError("This listing is already rejected and hidden from the marketplace.");

  const booking = await tx.rental.findFirst({
    where: { deviceId: device.id, status: { in: ["REQUESTED", "APPROVED", "ACTIVE", "RETURNED", "DISPUTED"] } },
    select: { id: true },
  });
  const proposedReplacement = await tx.collectionIssue.findFirst({
    where: { replacementDeviceId: device.id, status: "PROPOSED" },
    select: { id: true },
  });
  if (device.status === "RENTED" || booking || proposedReplacement) {
    throw new ListingModerationError("This item has an unresolved booking or replacement proposal. Resolve it under Rentals before removing the listing.");
  }

  await tx.device.update({ where: { id: device.id }, data: { status: "REJECTED" } });
  await tx.notification.create({ data: {
    userId: device.ownerId,
    deviceId: device.id,
    type: "LISTING_REJECTED",
    title: "Listing removed by administrator",
    message: `Your listing "${device.name}" has been rejected and removed from the marketplace. Reason: ${reason} You can update it and submit it for review again.`,
  } });
  await tx.auditLog.create({ data: {
    userId: input.adminId,
    action: "REMOVE_LISTING",
    entity: "Device",
    entityId: device.id,
    details: JSON.stringify({ previousStatus: device.status, status: "REJECTED", reason }),
  } });
}
