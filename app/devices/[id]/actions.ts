"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  redirect,
} from "next/navigation";

import {
  notifyBookingEvent,
} from "@/lib/booking-notifications";

import {
  prisma,
} from "@/lib/prisma";

import {
  requireRenter,
} from "@/lib/session";

export type RentalRequestState = {
  error?: string;
};

function readDate(
  value: FormDataEntryValue | null,
) {
  const text =
    String(
      value ?? "",
    ).trim();

  if (!text) {
    return null;
  }

  const date =
    new Date(
      `${text}T00:00:00`,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return date;
}

export async function createRentalRequest(
  deviceId: string,
  _previousState: RentalRequestState,
  formData: FormData,
): Promise<RentalRequestState> {
  /*
   * CRITICAL:
   * Only RENTER accounts can reach
   * the rental creation logic.
   */
  const renter =
    await requireRenter();

  const startDate =
    readDate(
      formData.get(
        "startDate",
      ),
    );

  const endDate =
    readDate(
      formData.get(
        "endDate",
      ),
    );

  const renterNote =
    String(
      formData.get(
        "renterNote",
      ) ?? "",
    )
      .trim()
      .slice(0, 500);

  if (
    !startDate ||
    !endDate
  ) {
    return {
      error:
        "Please choose your rental dates.",
    };
  }

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0,
  );

  if (
    startDate < today
  ) {
    return {
      error:
        "The rental start date cannot be in the past.",
    };
  }

  if (
    endDate <
    startDate
  ) {
    return {
      error:
        "The end date must be on or after the start date.",
    };
  }

  const totalDays =
    Math.floor(
      (endDate.getTime() -
        startDate.getTime()) /
        86400000,
    ) + 1;

  if (
    totalDays < 1
  ) {
    return {
      error:
        "Invalid rental period.",
    };
  }

  const rental =
    await prisma.$transaction(
      async (
        transaction,
      ) => {
        const device =
          await transaction.device.findFirst(
            {
              where: {
                id:
                  deviceId,

                status:
                  "AVAILABLE",
              },

              select: {
                id: true,
                ownerId:
                  true,
                pricePerDay:
                  true,
                depositAmount:
                  true,
              },
            },
          );

        if (!device) {
          throw new Error(
            "This device is no longer available.",
          );
        }

        /*
         * Protect against duplicate
         * requests from the same renter.
         */
        const existing =
          await transaction.rental.findFirst(
            {
              where: {
                deviceId:
                  device.id,

                renterId:
                  renter.id,

                status: {
                  in: [
                    "REQUESTED",
                    "APPROVED",
                    "ACTIVE",
                  ],
                },
              },

              select: {
                id: true,
              },
            },
          );

        if (
          existing
        ) {
          throw new Error(
            "You already have an active or pending booking for this device.",
          );
        }

        const pricePerDay =
          Number(
            device.pricePerDay,
          );

        const depositAmount =
          Number(
            device.depositAmount,
          );

        const rentalAmount =
          pricePerDay *
          totalDays;

        const totalAmount =
          rentalAmount +
          depositAmount;

        const created =
          await transaction.rental.create(
            {
              data: {
                deviceId:
                  device.id,

                renterId:
                  renter.id,

                ownerId:
                  device.ownerId,

                startDate,
                endDate,

                totalDays,

                pricePerDay,

                rentalAmount,

                depositAmount,

                totalAmount,

                status:
                  "REQUESTED",

                renterNote:
                  renterNote ||
                  null,
              },
            },
          );

        await notifyBookingEvent(
          transaction,
          device.ownerId,
          "REQUESTED",
          created.id,
        );

        return created;
      },
    );

  revalidatePath(
    "/renter/rentals",
  );

  revalidatePath(
    "/renter/dashboard",
  );

  revalidatePath(
    "/owner/requests",
  );

  revalidatePath(
    "/owner/notifications",
  );

  redirect(
    `/renter/rentals?created=${rental.id}`,
  );
}