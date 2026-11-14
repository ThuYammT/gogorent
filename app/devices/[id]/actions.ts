"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { notifyBookingEvent } from "@/lib/booking-notifications";
import { prisma } from "@/lib/prisma";
import { requireRenter } from "@/lib/session";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

function parseRentalDate(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Please choose valid rental dates.");
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new Error("Please choose valid rental dates.");
  }

  return date;
}

export async function createBookingRequest(
  deviceId: string,
  formData: FormData,
) {
  const renter = await requireRenter();
  const startDate = parseRentalDate(formData.get("startDate"));
  const endDate = parseRentalDate(formData.get("endDate"));
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (startDate < today || endDate <= startDate) {
    throw new Error("Choose a start date today or later and an end date after it.");
  }

  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / DAY_IN_MILLISECONDS,
  );
  const renterNoteEntry = formData.get("renterNote");

  if (
    renterNoteEntry !== null &&
    typeof renterNoteEntry !== "string"
  ) {
    throw new Error("Please provide a valid note.");
  }

  const renterNote = (renterNoteEntry ?? "").trim();

  if (renterNote.length > 1000) {
    throw new Error("The note must be 1,000 characters or fewer.");
  }

  const rental = await prisma.$transaction(async (transaction) => {
    const device = await transaction.device.findUnique({
      where: {
        id: deviceId,
      },
      select: {
        id: true,
        ownerId: true,
        name: true,
        pricePerDay: true,
        depositAmount: true,
        status: true,
      },
    });

    if (!device || device.status !== "AVAILABLE") {
      throw new Error("This device is no longer available.");
    }

    if (device.ownerId === renter.id) {
      throw new Error("You cannot request to rent your own device.");
    }

    const conflictingRental = await transaction.rental.findFirst({
      where: {
        deviceId: device.id,
        status: {
          in: ["REQUESTED", "APPROVED", "ACTIVE"],
        },
        startDate: {
          lt: endDate,
        },
        endDate: {
          gt: startDate,
        },
      },
      select: {
        id: true,
      },
    });

    if (conflictingRental) {
      throw new Error("This device is already requested for those dates.");
    }

    const rentalAmount = Number(device.pricePerDay) * totalDays;
    const depositAmount = Number(device.depositAmount);

    const createdRental = await transaction.rental.create({
      data: {
        deviceId: device.id,
        renterId: renter.id,
        ownerId: device.ownerId,
        startDate,
        endDate,
        totalDays,
        pricePerDay: device.pricePerDay,
        rentalAmount,
        depositAmount: device.depositAmount,
        totalAmount: rentalAmount + depositAmount,
        renterNote: renterNote || null,
      },
      select: {
        id: true,
      },
    });

    await notifyBookingEvent(
      transaction,
      device.ownerId,
      "REQUESTED",
      createdRental.id,
    );

    return createdRental;
  });

  revalidatePath("/owner/requests");
  revalidatePath("/owner/notifications");
  revalidatePath("/owner/dashboard");
  revalidatePath("/renter/rentals");
  revalidatePath("/renter/notifications");
  redirect(`/renter/rentals?created=${rental.id}`);
}
