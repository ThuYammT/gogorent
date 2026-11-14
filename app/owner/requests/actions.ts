"use server";

import { revalidatePath } from "next/cache";

import { notifyBookingEvent } from "@/lib/booking-notifications";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";

export async function approveRentalRequest(
  rentalId: string,
) {
  const owner = await requireOwner();

  await prisma.$transaction(async (transaction) => {
    const rental = await transaction.rental.findFirst({
      where: {
        id: rentalId,
        ownerId: owner.id,
        status: "REQUESTED",
      },
      select: {
        id: true,
        deviceId: true,
        renterId: true,
      },
    });

    if (!rental) {
      throw new Error(
        "Rental request not found or already processed.",
      );
    }

    const updated = await transaction.rental.updateMany({
      where: {
        id: rental.id,
        status: "REQUESTED",
      },
      data: {
        status: "APPROVED",
      },
    });

    if (updated.count !== 1) {
      throw new Error(
        "Rental request not found or already processed.",
      );
    }

    await transaction.device.update({
      where: {
        id: rental.deviceId,
      },
      data: {
        status: "UNAVAILABLE",
      },
    });

    await notifyBookingEvent(
      transaction,
      rental.renterId,
      "ACCEPTED",
      rental.id,
    );
  });

  revalidatePath("/owner/dashboard");
  revalidatePath("/owner/requests");
  revalidatePath("/owner/rentals");
  revalidatePath("/owner/notifications");
  revalidatePath("/renter/notifications");
  revalidatePath("/renter/rentals");
  revalidatePath("/devices");
}

export async function rejectRentalRequest(
  rentalId: string,
  formData: FormData,
) {
  const owner = await requireOwner();

  const reason = String(
    formData.get("reason") ?? "",
  ).trim();

  await prisma.$transaction(async (transaction) => {
    const rental = await transaction.rental.findFirst({
      where: {
        id: rentalId,
        ownerId: owner.id,
        status: "REQUESTED",
      },
      select: {
        id: true,
        renterId: true,
      },
    });

    if (!rental) {
      throw new Error(
        "Rental request not found or already processed.",
      );
    }

    const updated = await transaction.rental.updateMany({
      where: {
        id: rental.id,
        status: "REQUESTED",
      },
      data: {
        status: "REJECTED",
        rejectReason: reason || "Rejected by owner",
      },
    });

    if (updated.count !== 1) {
      throw new Error(
        "Rental request not found or already processed.",
      );
    }

    await notifyBookingEvent(
      transaction,
      rental.renterId,
      "REJECTED",
      rental.id,
    );
  });

  revalidatePath("/owner/dashboard");
  revalidatePath("/owner/requests");
  revalidatePath("/owner/notifications");
  revalidatePath("/renter/notifications");
  revalidatePath("/renter/rentals");
}

export async function cancelOwnerBooking(rentalId: string) {
  const owner = await requireOwner();

  await prisma.$transaction(async (transaction) => {
    const rental = await transaction.rental.findFirst({
      where: {
        id: rentalId,
        ownerId: owner.id,
        status: {
          in: ["REQUESTED", "APPROVED"],
        },
      },
      select: {
        id: true,
        renterId: true,
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
      rental.renterId,
      "CANCELLED",
      rental.id,
    );
  });

  revalidatePath("/owner/requests");
  revalidatePath("/owner/rentals");
  revalidatePath("/owner/notifications");
  revalidatePath("/renter/rentals");
  revalidatePath("/renter/notifications");
  revalidatePath("/devices");
}