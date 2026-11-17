import type {
  Prisma,
} from "@/lib/generated/prisma/client";

import { prisma } from "@/lib/prisma";

import type {
  OmiseCharge,
} from "@/lib/omise";

export function bahtToSatang(
  value: unknown,
) {
  const amount =
    Number(value);

  if (
    !Number.isFinite(
      amount,
    )
  ) {
    throw new Error(
      "Invalid payment amount.",
    );
  }

  return Math.round(
    amount * 100,
  );
}

export async function hasCompletedBookingPayment(
  tx: Prisma.TransactionClient,
  rentalId: string,
) {
  const transactions =
    await tx.transaction.findMany({
      where: {
        rentalId,

        status:
          "COMPLETED",

        type: {
          in: [
            "RENTAL_PAYMENT",
            "DEPOSIT_HOLD",
          ],
        },
      },

      select: {
        type: true,
      },
    });

  return (
    transactions.some(
      (item) =>
        item.type ===
        "RENTAL_PAYMENT",
    ) &&
    transactions.some(
      (item) =>
        item.type ===
        "DEPOSIT_HOLD",
    )
  );
}

export async function requireCompletedBookingPayment(
  tx: Prisma.TransactionClient,
  rentalId: string,
) {
  const paid =
    await hasCompletedBookingPayment(
      tx,
      rentalId,
    );

  if (!paid) {
    throw new Error(
      "Payment and security deposit must be completed before collection.",
    );
  }
}

export async function syncPromptPayCharge(
  charge: OmiseCharge,
) {
  const paymentRows =
    await prisma.transaction.findMany({
      where: {
        paymentRef:
          charge.id,

        type: {
          in: [
            "RENTAL_PAYMENT",
            "DEPOSIT_HOLD",
          ],
        },
      },

      select: {
        id: true,
        rentalId: true,
        type: true,
        status: true,
      },
    });

  if (
    paymentRows.length ===
    0
  ) {
    return {
      matched: false as const,
      status:
        charge.status,
    };
  }

  const rentalId =
    paymentRows[0].rentalId;

  if (
    paymentRows.some(
      (row) =>
        row.rentalId !==
        rentalId,
    )
  ) {
    throw new Error(
      "Payment reference is linked to multiple bookings.",
    );
  }

  const rental =
    await prisma.rental.findUnique({
      where: {
        id: rentalId,
      },

      select: {
        id: true,
        renterId: true,
        ownerId: true,
        rentalAmount: true,
        depositAmount: true,
        totalAmount: true,
      },
    });

  if (!rental) {
    throw new Error(
      "Booking not found for payment.",
    );
  }

  if (
    charge.currency.toUpperCase() !==
    "THB"
  ) {
    throw new Error(
      "Unexpected payment currency.",
    );
  }

  if (
    charge.amount !==
    bahtToSatang(
      rental.totalAmount,
    )
  ) {
    throw new Error(
      "Payment amount does not match the booking total.",
    );
  }

  if (
    charge.status ===
      "successful" &&
    charge.paid
  ) {
    await prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`
          SELECT "id"
          FROM "Rental"
          WHERE "id" = ${rentalId}
          FOR UPDATE
        `;

        const alreadyCompleted =
          await hasCompletedBookingPayment(
            tx,
            rentalId,
          );

        if (
          alreadyCompleted
        ) {
          return;
        }

        const updated =
          await tx.transaction.updateMany({
            where: {
              rentalId,

              paymentRef:
                charge.id,

              status:
                "PENDING",

              type: {
                in: [
                  "RENTAL_PAYMENT",
                  "DEPOSIT_HOLD",
                ],
              },
            },

            data: {
              status:
                "COMPLETED",
            },
          });

        if (
          updated.count !==
          2
        ) {
          throw new Error(
            "Expected two pending payment records for this booking.",
          );
        }

        await tx.notification.createMany({
          data: [
            {
              userId:
                rental.renterId,

              rentalId,

              type:
                "PAYMENT_COMPLETED",

              title:
                "PromptPay payment completed",

              message:
                "Your rental payment and security deposit were received. Collection is now available.",
            },

            {
              userId:
                rental.ownerId,

              rentalId,

              type:
                "PAYMENT_COMPLETED",

              title:
                "Booking payment received",

              message:
                "The renter completed the PromptPay payment and security deposit. You can proceed with collection.",
            },
          ],
        });

        await tx.auditLog.create({
          data: {
            userId:
              rental.renterId,

            action:
              "PROMPTPAY_PAYMENT_COMPLETED",

            entity:
              "Rental",

            entityId:
              rentalId,

            details:
              JSON.stringify({
                chargeId:
                  charge.id,

                amount:
                  charge.amount,
              }),
          },
        });
      },
    );
  } else if (
    charge.status ===
      "failed" ||
    charge.status ===
      "expired"
  ) {
    await prisma.transaction.updateMany({
      where: {
        rentalId,

        paymentRef:
          charge.id,

        status:
          "PENDING",

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
  }

  return {
    matched: true as const,
    rentalId,
    status:
      charge.status,
  };
}