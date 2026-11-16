"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  notifyBookingEvent,
} from "@/lib/booking-notifications";

import {
  lockRental,
  requireNoOpenCollectionIssue,
} from "@/lib/handover";

import {
  prisma,
} from "@/lib/prisma";

import {
  requireOwner,
} from "@/lib/session";

export async function approveRentalRequest(
  rentalId: string,
) {
  const owner =
    await requireOwner();

  await prisma.$transaction(
    async (transaction) => {
      const rental =
        await transaction.rental.findFirst({
          where: {
            id: rentalId,
            ownerId:
              owner.id,

            status:
              "REQUESTED",
          },

          select: {
            id: true,
            deviceId: true,
            renterId: true,
            rentalAmount: true,
            depositAmount: true,
          },
        });

      if (!rental) {
        throw new Error(
          "Rental request not found or already processed.",
        );
      }

      const updated =
        await transaction.rental.updateMany({
          where: {
            id:
              rental.id,

            status:
              "REQUESTED",
          },

          data: {
            status:
              "APPROVED",
          },
        });

      if (
        updated.count !==
        1
      ) {
        throw new Error(
          "Rental request not found or already processed.",
        );
      }

      const reserved =
        await transaction.device.updateMany({
          where: {
            id:
              rental.deviceId,

            ownerId:
              owner.id,

            status:
              "AVAILABLE",
          },

          data: {
            status:
              "UNAVAILABLE",
          },
        });

      if (
        reserved.count !==
        1
      ) {
        throw new Error(
          "The device is no longer available for this booking.",
        );
      }

      /*
       * One PromptPay payment will cover both amounts,
       * but we track rental and deposit separately.
       */
      await transaction.transaction.createMany({
        data: [
          {
            rentalId:
              rental.id,

            type:
              "RENTAL_PAYMENT",

            amount:
              rental.rentalAmount,

            status:
              "PENDING",
          },

          {
            rentalId:
              rental.id,

            type:
              "DEPOSIT_HOLD",

            amount:
              rental.depositAmount,

            status:
              "PENDING",
          },
        ],
      });

      await transaction.notification.create({
        data: {
          userId:
            rental.renterId,

          rentalId:
            rental.id,

          type:
            "PAYMENT_REQUIRED",

          title:
            "Payment required",

          message:
            "Your booking was approved. Complete the PromptPay payment and security deposit before collection.",
        },
      });

      await notifyBookingEvent(
        transaction,
        rental.renterId,
        "ACCEPTED",
        rental.id,
      );
    },
  );

  revalidatePath(
    "/owner/dashboard",
  );

  revalidatePath(
    "/owner/requests",
  );

  revalidatePath(
    "/owner/rentals",
  );

  revalidatePath(
    "/owner/notifications",
  );

  revalidatePath(
    "/renter/notifications",
  );

  revalidatePath(
    "/renter/rentals",
  );

  revalidatePath(
    "/devices",
  );
}

export async function rejectRentalRequest(
  rentalId: string,
  formData: FormData,
) {
  const owner =
    await requireOwner();

  const reason =
    String(
      formData.get(
        "reason",
      ) ?? "",
    ).trim();

  await prisma.$transaction(
    async (transaction) => {
      const rental =
        await transaction.rental.findFirst({
          where: {
            id: rentalId,

            ownerId:
              owner.id,

            status:
              "REQUESTED",
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

      const updated =
        await transaction.rental.updateMany({
          where: {
            id:
              rental.id,

            status:
              "REQUESTED",
          },

          data: {
            status:
              "REJECTED",

            rejectReason:
              reason ||
              "Rejected by owner",
          },
        });

      if (
        updated.count !==
        1
      ) {
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
    },
  );

  revalidatePath(
    "/owner/dashboard",
  );

  revalidatePath(
    "/owner/requests",
  );

  revalidatePath(
    "/owner/notifications",
  );

  revalidatePath(
    "/renter/notifications",
  );

  revalidatePath(
    "/renter/rentals",
  );
}

export async function cancelOwnerBooking(
  rentalId: string,
) {
  const owner =
    await requireOwner();

  await prisma.$transaction(
    async (transaction) => {
      await lockRental(
        transaction,
        rentalId,
      );

      await requireNoOpenCollectionIssue(
        transaction,
        rentalId,
      );

      const rental =
        await transaction.rental.findFirst({
          where: {
            id: rentalId,

            ownerId:
              owner.id,

            status: {
              in: [
                "REQUESTED",
                "APPROVED",
              ],
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

      /*
       * Once a real PromptPay charge exists or
       * money has been confirmed, cancellation
       * must go through our later refund flow.
       */
      const payment =
        await transaction.transaction.findFirst({
          where: {
            rentalId:
              rental.id,

            type: {
              in: [
                "RENTAL_PAYMENT",
                "DEPOSIT_HOLD",
              ],
            },

            OR: [
              {
                status:
                  "COMPLETED",
              },

              {
                paymentRef: {
                  not: null,
                },
              },
            ],
          },

          select: {
            id: true,
          },
        });

      if (payment) {
        throw new Error(
          "Payment has already started for this booking. Use the payment/refund flow instead of cancelling directly.",
        );
      }

      /*
       * Pending placeholders were never charged,
       * so close them.
       */
      await transaction.transaction.updateMany({
        where: {
          rentalId:
            rental.id,

          status:
            "PENDING",

          paymentRef:
            null,

          type: {
            in: [
              "RENTAL_PAYMENT",
              "DEPOSIT_HOLD",
            ],
          },
        },

        data: {
          status:
            "FAILED",
        },
      });

      const updated =
        await transaction.rental.updateMany({
          where: {
            id:
              rental.id,

            status:
              rental.status,
          },

          data: {
            status:
              "CANCELLED",
          },
        });

      if (
        updated.count !==
        1
      ) {
        throw new Error(
          "Booking was already updated.",
        );
      }

      if (
        rental.status ===
        "APPROVED"
      ) {
        await transaction.device.update({
          where: {
            id:
              rental.deviceId,
          },

          data: {
            status:
              "AVAILABLE",
          },
        });
      }

      await notifyBookingEvent(
        transaction,
        rental.renterId,
        "CANCELLED",
        rental.id,
      );
    },
  );

  revalidatePath(
    "/owner/requests",
  );

  revalidatePath(
    "/owner/rentals",
  );

  revalidatePath(
    "/owner/notifications",
  );

  revalidatePath(
    "/renter/rentals",
  );

  revalidatePath(
    "/renter/notifications",
  );

  revalidatePath(
    "/devices",
  );
}