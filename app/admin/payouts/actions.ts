"use server";

import {
  randomUUID,
} from "node:crypto";

import {
  revalidatePath,
} from "next/cache";

import type {
  Prisma,
} from "@/lib/generated/prisma/client";

import {
  requireAdmin,
} from "@/lib/admin-auth";

import {
  prisma,
} from "@/lib/prisma";

/* ======================================================
   RECEIPT UPLOAD
====================================================== */

const RECEIPT_BUCKET =
  "settlement-receipts";

const MAX_RECEIPT_SIZE =
  5 * 1024 * 1024;

const RECEIPT_TYPES: Record<
  string,
  string
> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function uploadReceipt(
  transactionId: string,
  category:
    | "deposit-refunds"
    | "owner-payouts",
  formData: FormData,
) {
  const file =
    formData.get(
      "transferReceipt",
    );

  if (
    !(file instanceof File) ||
    file.size === 0
  ) {
    throw new Error(
      "Transfer receipt is required.",
    );
  }

  const extension =
    RECEIPT_TYPES[file.type];

  if (!extension) {
    throw new Error(
      "Receipt must be JPG, PNG or WebP.",
    );
  }

  if (
    file.size >
    MAX_RECEIPT_SIZE
  ) {
    throw new Error(
      "Receipt image must be 5 MB or smaller.",
    );
  }

  const {
    supabaseAdmin,
  } = await import(
    "@/lib/supabase-admin"
  );

  const path =
    `${category}/${transactionId}/${randomUUID()}.${extension}`;

  const {
    error,
  } =
    await supabaseAdmin.storage
      .from(
        RECEIPT_BUCKET,
      )
      .upload(
        path,
        await file.arrayBuffer(),
        {
          contentType:
            file.type,

          upsert:
            false,
        },
      );

  if (error) {
    console.error(
      "Settlement receipt upload failed:",
      error.message,
    );

    throw new Error(
      "Could not upload the transfer receipt.",
    );
  }

  return path;
}

async function deleteReceiptSafely(
  path: string | null,
) {
  if (!path) {
    return;
  }

  try {
    const {
      supabaseAdmin,
    } = await import(
      "@/lib/supabase-admin"
    );

    await supabaseAdmin.storage
      .from(
        RECEIPT_BUCKET,
      )
      .remove([
        path,
      ]);
  } catch (error) {
    console.error(
      "Could not clean up settlement receipt:",
      error,
    );
  }
}

/* ======================================================
   COMPLETE RENTAL WHEN BOTH PAYMENTS FINISHED
====================================================== */

async function finalizeRentalIfSettled(
  transaction: Prisma.TransactionClient,
  rentalId: string,
) {
  const settlement =
    await transaction.transaction.findMany({
      where: {
        rentalId,

        type: {
          in: [
            "DEPOSIT_REFUND",
            "OWNER_PAYOUT",
          ],
        },
      },

      select: {
        type: true,
        status: true,
      },
    });

  const refundComplete =
    settlement.some(
      (item) =>
        item.type ===
          "DEPOSIT_REFUND" &&
        item.status ===
          "COMPLETED",
    );

  const payoutComplete =
    settlement.some(
      (item) =>
        item.type ===
          "OWNER_PAYOUT" &&
        item.status ===
          "COMPLETED",
    );

  if (
    !refundComplete ||
    !payoutComplete
  ) {
    return;
  }

  const rental =
    await transaction.rental.findUnique({
      where: {
        id:
          rentalId,
      },

      select: {
        id: true,
        status: true,
        renterId: true,
        ownerId: true,
      },
    });

  if (
    !rental ||
    rental.status !==
      "RETURNED"
  ) {
    return;
  }

  await transaction.rental.update({
    where: {
      id:
        rental.id,
    },

    data: {
      status:
        "COMPLETED",
    },
  });

  await transaction.notification.createMany({
    data: [
      {
        userId:
          rental.renterId,

        rentalId,

        type:
          "RENTAL_COMPLETED",

        title:
          "Rental completed",

        message:
          "Your security deposit refund has been processed and the rental is now complete.",
      },

      {
        userId:
          rental.ownerId,

        rentalId,

        type:
          "RENTAL_COMPLETED",

        title:
          "Rental completed",

        message:
          "Your payout has been processed and the rental is now complete.",
      },
    ],
  });
}

/* ======================================================
   RENTER DEPOSIT REFUND
====================================================== */

export async function markDepositRefundPaid(
  transactionId: string,
  formData: FormData,
) {
  await requireAdmin();

  const transferReference =
    String(
      formData.get(
        "transferReference",
      ) ?? "",
    ).trim();

  if (
    transferReference.length <
    3
  ) {
    throw new Error(
      "Enter a transfer reference.",
    );
  }

  /*
   * Check before uploading receipt.
   */
  const existingRefund =
    await prisma.transaction.findFirst({
      where: {
        id:
          transactionId,

        type:
          "DEPOSIT_REFUND",

        status:
          "PENDING",
      },

      include: {
        rental: {
          include: {
            renter: {
              include: {
                refundProfile:
                  true,
              },
            },
          },
        },
      },
    });

  if (!existingRefund) {
    throw new Error(
      "Pending deposit refund not found.",
    );
  }

  if (
    existingRefund.rental
      .status !==
    "RETURNED"
  ) {
    throw new Error(
      "This rental is not awaiting settlement.",
    );
  }

  if (
    !existingRefund.rental
      .renter.refundProfile
  ) {
    throw new Error(
      "The renter has not configured refund details yet.",
    );
  }

  const receiptPath =
    await uploadReceipt(
      existingRefund.id,
      "deposit-refunds",
      formData,
    );

  try {
    await prisma.$transaction(
      async (transaction) => {
        const updated =
          await transaction.transaction.updateMany({
            where: {
              id:
                existingRefund.id,

              type:
                "DEPOSIT_REFUND",

              status:
                "PENDING",
            },

            data: {
              status:
                "COMPLETED",

              paymentRef:
                `MANUAL:${transferReference}`,

              receiptPath,
            },
          });

        if (
          updated.count !==
          1
        ) {
          throw new Error(
            "This refund was already processed.",
          );
        }

        await transaction.notification.create({
          data: {
            userId:
              existingRefund
                .rental
                .renterId,

            rentalId:
              existingRefund
                .rentalId,

            type:
              "DEPOSIT_REFUND_COMPLETED",

            title:
              "Deposit refund completed",

            message:
              `GoGoRent processed your ฿${Number(
                existingRefund.amount,
              ).toLocaleString()} security deposit refund.`,
          },
        });

        await transaction.auditLog.create({
          data: {
            userId:
              existingRefund
                .rental
                .renterId,

            action:
              "DEPOSIT_REFUND_COMPLETED",

            entity:
              "Transaction",

            entityId:
              existingRefund.id,

            details:
              JSON.stringify({
                transferReference,
                receiptPath,
                amount:
                  Number(
                    existingRefund.amount,
                  ),
              }),
          },
        });

        await finalizeRentalIfSettled(
          transaction,
          existingRefund.rentalId,
        );
      },
    );
  } catch (error) {
    await deleteReceiptSafely(
      receiptPath,
    );

    throw error;
  }

  refreshFinancePages();
}

/* ======================================================
   OWNER PAYOUT
====================================================== */

export async function markOwnerPayoutPaid(
  transactionId: string,
  formData: FormData,
) {
  await requireAdmin();

  const transferReference =
    String(
      formData.get(
        "transferReference",
      ) ?? "",
    ).trim();

  if (
    transferReference.length <
    3
  ) {
    throw new Error(
      "Enter a transfer reference.",
    );
  }

  const existingPayout =
    await prisma.transaction.findFirst({
      where: {
        id:
          transactionId,

        type:
          "OWNER_PAYOUT",

        status:
          "PENDING",
      },

      include: {
        rental: {
          include: {
            owner: {
              include: {
                payoutProfile:
                  true,
              },
            },
          },
        },
      },
    });

  if (!existingPayout) {
    throw new Error(
      "Pending owner payout not found.",
    );
  }

  if (
    existingPayout.rental
      .status !==
    "RETURNED"
  ) {
    throw new Error(
      "This rental is not awaiting settlement.",
    );
  }

  if (
    !existingPayout.rental
      .owner.payoutProfile
  ) {
    throw new Error(
      "The owner has not configured payout details yet.",
    );
  }

  const receiptPath =
    await uploadReceipt(
      existingPayout.id,
      "owner-payouts",
      formData,
    );

  try {
    await prisma.$transaction(
      async (transaction) => {
        const updated =
          await transaction.transaction.updateMany({
            where: {
              id:
                existingPayout.id,

              type:
                "OWNER_PAYOUT",

              status:
                "PENDING",
            },

            data: {
              status:
                "COMPLETED",

              paymentRef:
                `MANUAL:${transferReference}`,

              receiptPath,
            },
          });

        if (
          updated.count !==
          1
        ) {
          throw new Error(
            "This payout was already processed.",
          );
        }

        await transaction.notification.create({
          data: {
            userId:
              existingPayout
                .rental
                .ownerId,

            rentalId:
              existingPayout
                .rentalId,

            type:
              "OWNER_PAYOUT_COMPLETED",

            title:
              "Payout completed",

            message:
              `GoGoRent processed your ฿${Number(
                existingPayout.amount,
              ).toLocaleString()} owner payout.`,
          },
        });

        await transaction.auditLog.create({
          data: {
            userId:
              existingPayout
                .rental
                .ownerId,

            action:
              "OWNER_PAYOUT_COMPLETED",

            entity:
              "Transaction",

            entityId:
              existingPayout.id,

            details:
              JSON.stringify({
                transferReference,
                receiptPath,
                amount:
                  Number(
                    existingPayout.amount,
                  ),
              }),
          },
        });

        await finalizeRentalIfSettled(
          transaction,
          existingPayout.rentalId,
        );
      },
    );
  } catch (error) {
    await deleteReceiptSafely(
      receiptPath,
    );

    throw error;
  }

  refreshFinancePages();
}

/* ======================================================
   REVALIDATION
====================================================== */

function refreshFinancePages() {
  revalidatePath(
    "/admin/payouts",
  );

  revalidatePath(
    "/admin/transactions",
  );

  revalidatePath(
    "/admin/rentals",
  );

  revalidatePath(
    "/admin/dashboard",
  );

  revalidatePath(
    "/owner/rentals",
  );

  revalidatePath(
    "/owner/earnings",
  );

  revalidatePath(
    "/owner/dashboard",
  );

  revalidatePath(
    "/owner/notifications",
  );

  revalidatePath(
    "/renter/rentals",
  );

  revalidatePath(
    "/renter/dashboard",
  );

  revalidatePath(
    "/renter/notifications",
  );
}