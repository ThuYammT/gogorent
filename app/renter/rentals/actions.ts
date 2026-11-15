"use server";

import { revalidatePath } from "next/cache";

import { notifyBookingEvent } from "@/lib/booking-notifications";
import { confirmCollection, HandoverError, lockRental, requireNoOpenCollectionIssue, verifyHandover } from "@/lib/handover";
import { prisma } from "@/lib/prisma";
import { requireRenter } from "@/lib/session";

export async function scanCollectionQr(
  rentalId: string,
  token: string,
): Promise<{ success: true } | { error: string }> {
  await requireRenter();

  if (typeof rentalId !== "string" || typeof token !== "string") {
    return { error: "Invalid QR code." };
  }

  try {
    await verifyHandover(rentalId, "COLLECTION", token);
  } catch (error) {
    if (error instanceof HandoverError) {
      return { error: error.message };
    }

    console.error(
      "Collection QR verification failed:",
      error instanceof Error ? error.name : "Unknown error",
    );
    return { error: "Could not verify the QR code. Please try again." };
  }

  revalidatePath("/renter/rentals");
  revalidatePath(`/renter/rentals/${rentalId}`);
  revalidatePath("/owner/rentals");
  revalidatePath("/owner/notifications");
  return { success: true };
}

export async function confirmCollectionReceipt(
  rentalId: string,
  _previousState: { error: string } | { success: true } | null,
  formData: FormData,
): Promise<{ error: string } | { success: true }> {
  await requireRenter();

  const listedCondition = formData.get("listedCondition");
  if (typeof rentalId !== "string" ||
      typeof listedCondition !== "string" ||
      formData.get("condition") !== "confirmed" ||
      formData.get("received") !== "confirmed") {
    return { error: "Confirm the device condition and receipt before continuing." };
  }

  try {
    await confirmCollection(rentalId, listedCondition);
  } catch (error) {
    if (error instanceof HandoverError) {
      return { error: error.message };
    }
    console.error(
      "Collection confirmation failed:",
      error instanceof Error ? error.name : "Unknown error",
    );
    return { error: "Could not confirm collection. Please try again." };
  }

  revalidatePath(`/renter/rentals/${rentalId}`);
  revalidatePath("/renter/rentals");
  revalidatePath("/renter/dashboard");
  revalidatePath("/owner/rentals");
  revalidatePath("/owner/devices");
  revalidatePath("/owner/dashboard");
  revalidatePath("/owner/notifications");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/transactions");
  revalidatePath("/devices");
  return { success: true };
}

export async function cancelRenterBooking(rentalId: string) {
  const renter = await requireRenter();

  await prisma.$transaction(async (transaction) => {
    await lockRental(transaction, rentalId);
    await requireNoOpenCollectionIssue(transaction, rentalId);
    const rental = await transaction.rental.findFirst({
      where: {
        id: rentalId,
        renterId: renter.id,
        status: {
          in: ["REQUESTED", "APPROVED"],
        },
      },
      select: {
        id: true,
        ownerId: true,
        deviceId: true,
        status: true,
      },
    });

    if (!rental) {
      throw new Error(
        "Booking cannot be cancelled because it is not pending or approved.",
      );
    }

    const updated = await transaction.rental.updateMany({
      where: {
        id: rental.id,
        status: rental.status,
      },
      data: {
        status: "CANCELLED",
      },
    });

    if (updated.count !== 1) {
      throw new Error("Booking was already updated.");
    }

    if (rental.status === "APPROVED") {
      await transaction.device.update({
        where: {
          id: rental.deviceId,
        },
        data: {
          status: "AVAILABLE",
        },
      });
    }

    await notifyBookingEvent(
      transaction,
      rental.ownerId,
      "CANCELLED",
      rentalId,
    );
  });

  revalidatePath("/renter/rentals");
  revalidatePath("/renter/notifications");
  revalidatePath("/owner/notifications");
  revalidatePath("/owner/requests");
  revalidatePath("/owner/rentals");
  revalidatePath("/devices");
}
