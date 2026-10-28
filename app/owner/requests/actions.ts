"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";

export async function approveRentalRequest(
  rentalId: string,
) {
  const owner = await requireOwner();

  const rental = await prisma.rental.findFirst({
    where: {
      id: rentalId,
      ownerId: owner.id,
      status: "REQUESTED",
    },
  });

  if (!rental) {
    throw new Error(
      "Rental request not found or already processed.",
    );
  }

  await prisma.$transaction([
    prisma.rental.update({
      where: {
        id: rental.id,
      },
      data: {
        status: "APPROVED",
      },
    }),

    prisma.device.update({
      where: {
        id: rental.deviceId,
      },
      data: {
        status: "UNAVAILABLE",
      },
    }),

    prisma.notification.create({
      data: {
        userId: rental.renterId,
        title: "Rental request approved",
        message:
          "Your rental request has been approved by the owner.",
      },
    }),
  ]);

  revalidatePath("/owner/dashboard");
  revalidatePath("/owner/requests");
  revalidatePath("/owner/rentals");
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

  const rental = await prisma.rental.findFirst({
    where: {
      id: rentalId,
      ownerId: owner.id,
      status: "REQUESTED",
    },
  });

  if (!rental) {
    throw new Error(
      "Rental request not found or already processed.",
    );
  }

  await prisma.$transaction([
    prisma.rental.update({
      where: {
        id: rental.id,
      },
      data: {
        status: "REJECTED",
        rejectReason:
          reason || "Rejected by owner",
      },
    }),

    prisma.notification.create({
      data: {
        userId: rental.renterId,
        title: "Rental request declined",
        message: reason
          ? `The owner declined your request: ${reason}`
          : "The owner declined your rental request.",
      },
    }),
  ]);

  revalidatePath("/owner/dashboard");
  revalidatePath("/owner/requests");
}