"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { ListingModerationError, removeMarketplaceListing } from "@/lib/listing-moderation";

function refreshListings(deviceId: string) {
  for (const path of ["/", "/devices", `/devices/${deviceId}`, "/admin/listings", `/admin/listings/${deviceId}`, "/admin/dashboard", "/admin/audit-logs", "/owner/devices", `/owner/devices/${deviceId}`, `/owner/devices/${deviceId}/edit`, "/owner/dashboard", "/owner/notifications", "/renter/favorites"]) revalidatePath(path);
}

export async function approveListing(deviceId: string) {
  const admin = await requireAdmin();
  await prisma.$transaction(async tx => {
    const device = await tx.device.findUnique({ where: { id: deviceId } });
    if (!device) throw new Error("Listing not found.");
    const updated = await tx.device.updateMany({ where: { id: deviceId, status: "PENDING_APPROVAL" }, data: { status: "AVAILABLE" } });
    if (updated.count !== 1) throw new Error("Only pending listings can be approved. Refresh to see the latest status.");
    await tx.notification.create({ data: {
      userId: device.ownerId, deviceId, type: "LISTING_APPROVED", title: "Listing approved",
      message: `Your listing "${device.name}" has been approved and is now available on the marketplace.`,
    } });
    await tx.auditLog.create({ data: { userId: admin.id, action: "APPROVE_LISTING", entity: "Device", entityId: deviceId } });
  });
  refreshListings(deviceId);
}

export type RemoveListingState = { error?: string; success?: string };

export async function removeListing(deviceId: string, _previous: RemoveListingState, formData: FormData): Promise<RemoveListingState> {
  const admin = await requireAdmin();
  const reason = formData.get("reason");
  if (typeof reason !== "string") return { error: "Provide a reason for the owner." };
  try {
    await prisma.$transaction(tx => removeMarketplaceListing(tx, { deviceId, adminId: admin.id, reason }));
  } catch (error) {
    return { error: error instanceof ListingModerationError ? error.message : "Could not remove this listing. Please try again." };
  }
  refreshListings(deviceId);
  return { success: "Listing removed from the marketplace. The owner has been notified and the item is marked Rejected." };
}
