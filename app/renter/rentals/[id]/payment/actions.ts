"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  createPromptPayCharge,
  promptPayQrUrl,
  retrieveOmiseCharge,
} from "@/lib/omise";

import {
  bahtToSatang,
  syncPromptPayCharge,
} from "@/lib/promptpay-payment";

import {
  prisma,
} from "@/lib/prisma";

import {
  requireRenter,
} from "@/lib/session";

export type PromptPayState =
  | {
      status:
        "pending";

      chargeId:
        string;

      qrUrl:
        string;

      expiresAt:
        string | null;
    }
  | {
      status:
        "paid";
    }
  | {
      status:
        "failed";

      message:
        string;
    };

async function getApprovedRental(
  rentalId: string,
  renterId: string,
) {
  const rental =
    await prisma.rental.findFirst({
      where: {
        id:
          rentalId,

        renterId,

        status:
          "APPROVED",
      },

      include: {
        collectionIssues: {
          where: {
            status: {
              in: [
                "OPEN",
                "PROPOSED",
              ],
            },
          },

          select: {
            id: true,
          },
        },

        transactions: {
          where: {
            type: {
              in: [
                "RENTAL_PAYMENT",
                "DEPOSIT_HOLD",
              ],
            },
          },

          orderBy: {
            createdAt:
              "desc",
          },
        },
      },
    });

  if (!rental) {
    throw new Error(
      "This booking is not available for payment.",
    );
  }

  if (
    rental
      .collectionIssues
      .length > 0
  ) {
    throw new Error(
      "Resolve the collection issue before creating a new payment QR.",
    );
  }

  return rental;
}

function completed(
  types: {
    type: string;
    status: string;
  }[],
) {
  return (
    types.some(
      (item) =>
        item.type ===
          "RENTAL_PAYMENT" &&
        item.status ===
          "COMPLETED",
    ) &&
    types.some(
      (item) =>
        item.type ===
          "DEPOSIT_HOLD" &&
        item.status ===
          "COMPLETED",
    )
  );
}

async function createFreshPendingRows(
  rental: Awaited<
    ReturnType<
      typeof getApprovedRental
    >
  >,
) {
  await prisma.transaction.createMany({
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
}

export async function createPromptPayForRental(
  rentalId: string,
): Promise<PromptPayState> {
  try {
    const renter =
      await requireRenter();

    let rental =
      await getApprovedRental(
        rentalId,
        renter.id,
      );

    if (
      completed(
        rental.transactions,
      )
    ) {
      return {
        status:
          "paid",
      };
    }

    /*
     * Check if this booking already has an
     * unfinished PromptPay charge.
     */
    const currentChargeId =
      rental.transactions.find(
        (item) =>
          item.status ===
            "PENDING" &&
          item.paymentRef,
      )?.paymentRef;

    if (
      currentChargeId
    ) {
      const currentCharge =
        await retrieveOmiseCharge(
          currentChargeId,
        );

      await syncPromptPayCharge(
        currentCharge,
      );

      if (
        currentCharge.status ===
          "successful" &&
        currentCharge.paid
      ) {
        revalidatePath(
          `/renter/rentals/${rentalId}`,
        );

        revalidatePath(
          "/owner/rentals",
        );

        return {
          status:
            "paid",
        };
      }

      if (
        currentCharge.status ===
        "pending"
      ) {
        const qrUrl =
          promptPayQrUrl(
            currentCharge,
          );

        if (!qrUrl) {
          return {
            status:
              "failed",

            message:
              "PromptPay QR is not available for this charge.",
          };
        }

        return {
          status:
            "pending",

          chargeId:
            currentCharge.id,

          qrUrl,

          expiresAt:
            currentCharge.expires_at,
        };
      }

      /*
       * Previous QR failed or expired.
       * Reload transaction state.
       */
      rental =
        await getApprovedRental(
          rentalId,
          renter.id,
        );
    }

    const hasPendingRental =
      rental.transactions.some(
        (item) =>
          item.type ===
            "RENTAL_PAYMENT" &&
          item.status ===
            "PENDING" &&
          !item.paymentRef,
      );

    const hasPendingDeposit =
      rental.transactions.some(
        (item) =>
          item.type ===
            "DEPOSIT_HOLD" &&
          item.status ===
            "PENDING" &&
          !item.paymentRef,
      );

    /*
     * If the previous QR expired, those old
     * rows became FAILED, so create fresh ones.
     */
    if (
      !hasPendingRental ||
      !hasPendingDeposit
    ) {
      await createFreshPendingRows(
        rental,
      );
    }

    const amountSatang =
      bahtToSatang(
        rental.totalAmount,
      );

    /*
     * Omise PromptPay limits:
     * ฿20 - ฿150,000.
     */
    if (
      amountSatang <
        2000 ||
      amountSatang >
        15000000
    ) {
      return {
        status:
          "failed",

        message:
          "PromptPay supports payments from ฿20 to ฿150,000.",
      };
    }

    const charge =
      await createPromptPayCharge({
        amountSatang,

        rentalId,

        description:
          `GoGoRent booking #${rentalId.slice(
            -6,
          )}`,
      });

    const qrUrl =
      promptPayQrUrl(
        charge,
      );

    if (!qrUrl) {
      return {
        status:
          "failed",

        message:
          "Omise did not return a PromptPay QR code.",
      };
    }

    /*
     * Both accounting rows point to the SAME
     * real PromptPay charge.
     */
    const linked =
      await prisma.transaction.updateMany({
        where: {
          rentalId,

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
          paymentRef:
            charge.id,
        },
      });

    if (
      linked.count !==
      2
    ) {
      return {
        status:
          "failed",

        message:
          "Could not link the payment to both booking transactions.",
      };
    }

    await prisma.auditLog.create({
      data: {
        userId:
          renter.id,

        action:
          "PROMPTPAY_CHARGE_CREATED",

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

    return {
      status:
        "pending",

      chargeId:
        charge.id,

      qrUrl,

      expiresAt:
        charge.expires_at,
    };
  } catch (error) {
    return {
      status:
        "failed",

      message:
        error instanceof Error
          ? error.message
          : "Could not create PromptPay payment.",
    };
  }
}

export async function checkPromptPayForRental(
  rentalId: string,
): Promise<PromptPayState> {
  try {
    const renter =
      await requireRenter();

    const rental =
      await prisma.rental.findFirst({
        where: {
          id:
            rentalId,

          renterId:
            renter.id,
        },

        include: {
          transactions: {
            where: {
              type: {
                in: [
                  "RENTAL_PAYMENT",
                  "DEPOSIT_HOLD",
                ],
              },
            },

            orderBy: {
              createdAt:
                "desc",
            },
          },
        },
      });

    if (!rental) {
      return {
        status:
          "failed",

        message:
          "Booking not found.",
      };
    }

    if (
      completed(
        rental.transactions,
      )
    ) {
      return {
        status:
          "paid",
      };
    }

    const chargeId =
      rental.transactions.find(
        (item) =>
          item.status ===
            "PENDING" &&
          item.paymentRef,
      )?.paymentRef;

    if (!chargeId) {
      return {
        status:
          "failed",

        message:
          "No active PromptPay charge was found.",
      };
    }

    /*
     * Never trust the browser.
     * Retrieve the charge directly from Omise.
     */
    const charge =
      await retrieveOmiseCharge(
        chargeId,
      );

    await syncPromptPayCharge(
      charge,
    );

    if (
      charge.status ===
        "successful" &&
      charge.paid
    ) {
      revalidatePath(
        `/renter/rentals/${rentalId}`,
      );

      revalidatePath(
        `/renter/rentals/${rentalId}/payment`,
      );

      revalidatePath(
        "/renter/rentals",
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

      return {
        status:
          "paid",
      };
    }

    if (
      charge.status ===
        "failed" ||
      charge.status ===
        "expired"
    ) {
      return {
        status:
          "failed",

        message:
          charge.failure_message ||
          "This PromptPay QR is no longer payable. Generate a new one.",
      };
    }

    const qrUrl =
      promptPayQrUrl(
        charge,
      );

    if (!qrUrl) {
      return {
        status:
          "failed",

        message:
          "PromptPay QR is not available.",
      };
    }

    return {
      status:
        "pending",

      chargeId:
        charge.id,

      qrUrl,

      expiresAt:
        charge.expires_at,
    };
  } catch (error) {
    return {
      status:
        "failed",

      message:
        error instanceof Error
          ? error.message
          : "Could not check payment status.",
    };
  }
}