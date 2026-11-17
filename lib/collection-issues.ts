import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

import {
  HandoverError,
  lockRental,
} from "@/lib/handover";

import {
  hasCompletedBookingPayment,
} from "@/lib/promptpay-payment";

import type {
  CollectionIssueCategory,
  CollectionIssueOutcome,
  Prisma,
} from "@/lib/generated/prisma/client";

type Evidence = {
  path: string;
  mimeType: string;
};

async function actorFor(
  role: "RENTER" | "OWNER",
) {
  const actor =
    await getSession();

  if (
    !actor ||
    actor.role !== role
  ) {
    throw new HandoverError(
      "You are not authorized to manage this issue.",
    );
  }

  return actor;
}

async function audit(
  tx: Prisma.TransactionClient,
  userId: string,
  issueId: string,
  action: string,
  details: object,
) {
  await tx.auditLog.create({
    data: {
      userId,
      entity:
        "CollectionIssue",
      entityId:
        issueId,
      action,
      details:
        JSON.stringify(
          details,
        ),
    },
  });
}

async function notify(
  tx: Prisma.TransactionClient,
  userId: string,
  rentalId: string,
  type: string,
  title: string,
  message: string,
) {
  await tx.notification.create({
    data: {
      userId,
      rentalId,
      type,
      title,
      message,
    },
  });
}

/*
 * Invalidates any previously generated
 * collection QR.
 *
 * After REPLACE or REPAIR the owner
 * should generate a fresh QR.
 */
async function resetCollectionHandover(
  tx: Prisma.TransactionClient,
  rentalId: string,
) {
  await tx.handover.updateMany({
    where: {
      rentalId,
      type:
        "COLLECTION",
    },

    data: {
      status:
        "INITIATED",

      expiresAt:
        new Date(0),

      scannedAt:
        null,

      ownerConfirmedAt:
        null,

      renterConfirmedAt:
        null,

      verifiedAt:
        null,
    },
  });
}

/*
 * Make sure this issue belongs to
 * a booking whose PromptPay payment
 * and deposit were already completed.
 */
async function requirePaidCollection(
  tx: Prisma.TransactionClient,
  rentalId: string,
) {
  const paid =
    await hasCompletedBookingPayment(
      tx,
      rentalId,
    );

  if (!paid) {
    throw new HandoverError(
      "Complete the PromptPay payment before reporting a collection issue.",
    );
  }
}

export async function assertRenterCanReport(
  rentalId: string,
) {
  const actor =
    await actorFor(
      "RENTER",
    );

  const rental =
    await prisma.rental.findFirst({
      where: {
        id:
          rentalId,

        renterId:
          actor.userId,

        status:
          "APPROVED",
      },

      select: {
        id: true,
      },
    });

  if (!rental) {
    throw new HandoverError(
      "This booking is not available for reporting an issue.",
    );
  }

  const paymentRows =
    await prisma.transaction.findMany({
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

  const paymentComplete =
    paymentRows.some(
      (item) =>
        item.type ===
        "RENTAL_PAYMENT",
    ) &&
    paymentRows.some(
      (item) =>
        item.type ===
        "DEPOSIT_HOLD",
    );

  if (!paymentComplete) {
    throw new HandoverError(
      "Complete the PromptPay payment before reporting a collection issue.",
    );
  }
}

export async function reportCollectionIssue(
  input: {
    id: string;
    rentalId: string;
    category:
      CollectionIssueCategory;
    description:
      string;
    evidence:
      Evidence[];
  },
) {
  const actor =
    await actorFor(
      "RENTER",
    );

  await prisma.$transaction(
    async (tx) => {
      const rental =
        await lockRental(
          tx,
          input.rentalId,
        );

      if (
        rental.renterId !==
          actor.userId ||
        rental.status !==
          "APPROVED"
      ) {
        throw new HandoverError(
          "This booking is not available for reporting an issue.",
        );
      }

      /*
       * Phase 2:
       * issue reporting happens after payment.
       */
      await requirePaidCollection(
        tx,
        rental.id,
      );

      const existing =
        await tx.collectionIssue.findFirst({
          where: {
            rentalId:
              rental.id,

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
        });

      if (existing) {
        throw new HandoverError(
          "This booking already has an unresolved device issue.",
        );
      }

      await tx.collectionIssue.create({
        data: {
          id:
            input.id,

          rentalId:
            rental.id,

          deviceId:
            rental.deviceId,

          category:
            input.category,

          description:
            input.description,

          evidence: {
            create:
              input.evidence,
          },
        },
      });

      /*
       * An already-generated QR must not
       * remain usable while the issue is open.
       */
      await resetCollectionHandover(
        tx,
        rental.id,
      );

      await audit(
        tx,
        actor.userId,
        input.id,
        "COLLECTION_ISSUE_REPORTED",
        {
          category:
            input.category,
          paymentHeld:
            true,
        },
      );

      await notify(
        tx,
        rental.ownerId,
        rental.id,
        "COLLECTION_ISSUE_REPORTED",
        "Device issue reported",
        "The renter reported an issue before collection. Payment is being held while you review the issue.",
      );

      await notify(
        tx,
        rental.renterId,
        rental.id,
        "COLLECTION_ISSUE_REPORTED",
        "Collection paused",
        "Your issue was reported successfully. Collection is paused while the owner proposes a resolution.",
      );
    },
  );
}

export async function proposeCollectionIssue(
  rentalId: string,
  issueId: string,
  outcome:
    CollectionIssueOutcome,
  replacementDeviceId:
    string | null,
) {
  const actor =
    await actorFor(
      "OWNER",
    );

  await prisma.$transaction(
    async (tx) => {
      const rental =
        await lockRental(
          tx,
          rentalId,
        );

      if (
        rental.ownerId !==
          actor.userId ||
        rental.status !==
          "APPROVED"
      ) {
        throw new HandoverError(
          "This booking is not available for an issue proposal.",
        );
      }

      const issue =
        await tx.collectionIssue.findFirst({
          where: {
            id:
              issueId,

            rentalId,

            status:
              "OPEN",
          },

          select: {
            id: true,
            deviceId: true,
          },
        });

      if (
        !issue ||
        issue.deviceId !==
          rental.deviceId
      ) {
        throw new HandoverError(
          "This issue is no longer available for a proposal.",
        );
      }

      if (
        outcome ===
        "REPLACE"
      ) {
        if (
          !replacementDeviceId ||
          replacementDeviceId ===
            rental.deviceId
        ) {
          throw new HandoverError(
            "Choose a different replacement device.",
          );
        }

        const replacement =
          await tx.device.findFirst({
            where: {
              id:
                replacementDeviceId,

              ownerId:
                actor.userId,

              status:
                "AVAILABLE",
            },

            select: {
              id: true,
            },
          });

        if (!replacement) {
          throw new HandoverError(
            "The replacement device is not available.",
          );
        }
      } else if (
        replacementDeviceId
      ) {
        throw new HandoverError(
          "A replacement device is only allowed for a replacement proposal.",
        );
      }

      await tx.collectionIssue.update({
        where: {
          id:
            issue.id,
        },

        data: {
          status:
            "PROPOSED",

          proposedOutcome:
            outcome,

          replacementDeviceId,

          proposedAt:
            new Date(),
        },
      });

      await audit(
        tx,
        actor.userId,
        issue.id,
        "COLLECTION_ISSUE_PROPOSED",
        {
          outcome,
          replacementDeviceId,
        },
      );

      const proposalMessage =
        outcome ===
        "REPLACE"
          ? "The owner proposed replacing the device. Your original payment and deposit will stay unchanged."
          : outcome ===
              "REPAIR"
            ? "The owner proposed resolving the issue before handover. Inspect the device again before accepting."
            : "The owner proposed cancelling the booking. If you accept, your test payment and deposit will be marked as refunded.";

      await notify(
        tx,
        rental.renterId,
        rentalId,
        "COLLECTION_ISSUE_PROPOSED",
        "Device issue resolution proposed",
        proposalMessage,
      );
    },
  );
}

export async function respondToCollectionIssue(
  rentalId: string,
  issueId: string,
  outcome:
    CollectionIssueOutcome,
  proposedAt: string,
  replacementDeviceId:
    string | null,
  accept: boolean,
) {
  const actor =
    await actorFor(
      "RENTER",
    );

  await prisma.$transaction(
    async (tx) => {
      const rental =
        await lockRental(
          tx,
          rentalId,
        );

      if (
        rental.renterId !==
          actor.userId ||
        rental.status !==
          "APPROVED"
      ) {
        throw new HandoverError(
          "This booking is not available for an issue response.",
        );
      }

      const issue =
        await tx.collectionIssue.findFirst({
          where: {
            id:
              issueId,

            rentalId,

            status:
              "PROPOSED",
          },
        });

      if (
        !issue ||
        issue.proposedOutcome !==
          outcome ||
        issue.proposedAt?.toISOString() !==
          proposedAt ||
        issue.replacementDeviceId !==
          replacementDeviceId ||
        issue.deviceId !==
          rental.deviceId
      ) {
        throw new HandoverError(
          "The proposal has changed. Refresh the booking before responding.",
        );
      }

      /*
       * RENTER DECLINES PROPOSAL
       */
      if (!accept) {
        await tx.collectionIssue.update({
          where: {
            id:
              issue.id,
          },

          data: {
            status:
              "OPEN",

            proposedOutcome:
              null,

            replacementDeviceId:
              null,

            proposedAt:
              null,
          },
        });

        await audit(
          tx,
          actor.userId,
          issue.id,
          "COLLECTION_ISSUE_DECLINED",
          {
            outcome,
          },
        );

        await notify(
          tx,
          rental.ownerId,
          rentalId,
          "COLLECTION_ISSUE_DECLINED",
          "Issue proposal declined",
          "The renter declined your proposed resolution. Please review the issue and propose another outcome.",
        );

        return;
      }

      /*
       * =================================================
       * REPLACE DEVICE
       * =================================================
       */
      if (
        outcome ===
        "REPLACE"
      ) {
        if (
          !issue.replacementDeviceId ||
          issue.replacementDeviceId ===
            rental.deviceId
        ) {
          throw new HandoverError(
            "The replacement proposal is invalid.",
          );
        }

        const reserved =
          await tx.device.updateMany({
            where: {
              id:
                issue.replacementDeviceId,

              ownerId:
                rental.ownerId,

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
          throw new HandoverError(
            "The proposed replacement is no longer available. Ask the owner for a new proposal.",
          );
        }

        /*
         * Keep the original problematic device
         * UNAVAILABLE so it cannot be rented by
         * somebody else until the owner reviews it.
         *
         * Payment/deposit stay COMPLETED.
         */
        await tx.rental.update({
          where: {
            id:
              rentalId,
          },

          data: {
            deviceId:
              issue.replacementDeviceId,
          },
        });

        await resetCollectionHandover(
          tx,
          rentalId,
        );

        await tx.collectionIssue.update({
          where: {
            id:
              issue.id,
          },

          data: {
            status:
              "RESOLVED",

            resolvedAt:
              new Date(),

            paymentReviewRequired:
              false,
          },
        });

        await audit(
          tx,
          actor.userId,
          issue.id,
          "COLLECTION_ISSUE_AGREED",
          {
            outcome:
              "REPLACE",

            originalDeviceId:
              rental.deviceId,

            replacementDeviceId:
              issue.replacementDeviceId,

            paymentChanged:
              false,
          },
        );

        const message =
          "The replacement was accepted. Your original rental payment and deposit remain valid. The owner can now generate a fresh collection QR.";

        await notify(
          tx,
          rental.ownerId,
          rentalId,
          "COLLECTION_ISSUE_AGREED",
          "Replacement accepted",
          message,
        );

        await notify(
          tx,
          rental.renterId,
          rentalId,
          "COLLECTION_ISSUE_AGREED",
          "Replacement accepted",
          message,
        );

        return;
      }

      /*
       * =================================================
       * REPAIR / RESOLVE BEFORE HANDOVER
       * =================================================
       */
      if (
        outcome ===
        "REPAIR"
      ) {
        /*
         * Payment remains COMPLETED.
         * Device stays reserved.
         *
         * Force a fresh QR after issue resolution.
         */
        await resetCollectionHandover(
          tx,
          rentalId,
        );

        await tx.collectionIssue.update({
          where: {
            id:
              issue.id,
          },

          data: {
            status:
              "RESOLVED",

            resolvedAt:
              new Date(),

            paymentReviewRequired:
              false,
          },
        });

        await audit(
          tx,
          actor.userId,
          issue.id,
          "COLLECTION_ISSUE_AGREED",
          {
            outcome:
              "REPAIR",

            paymentChanged:
              false,
          },
        );

        const message =
          "The issue was accepted as resolved. Payment remains confirmed and collection can continue with a new QR.";

        await notify(
          tx,
          rental.ownerId,
          rentalId,
          "COLLECTION_ISSUE_AGREED",
          "Issue resolved",
          message,
        );

        await notify(
          tx,
          rental.renterId,
          rentalId,
          "COLLECTION_ISSUE_AGREED",
          "Issue resolved",
          message,
        );

        return;
      }

      /*
       * =================================================
       * CANCEL BOOKING
       * =================================================
       *
       * UNIVERSITY PROJECT / TEST MODE:
       *
       * We DO NOT call a real Omise refund API.
       *
       * Instead:
       *
       * RENTAL_PAYMENT → REFUNDED
       * DEPOSIT_HOLD   → REFUNDED
       * DEPOSIT_REFUND → COMPLETED
       */
      if (
        outcome ===
        "CANCEL"
      ) {
        const payment =
          await tx.transaction.findFirst({
            where: {
              rentalId,

              type:
                "RENTAL_PAYMENT",

              status:
                "COMPLETED",
            },

            orderBy: {
              createdAt:
                "desc",
            },
          });

        const deposit =
          await tx.transaction.findFirst({
            where: {
              rentalId,

              type:
                "DEPOSIT_HOLD",

              status:
                "COMPLETED",
            },

            orderBy: {
              createdAt:
                "desc",
            },
          });

        /*
         * Don't allow half-refunded inconsistent
         * payment state.
         */
        if (
          Boolean(payment) !==
          Boolean(deposit)
        ) {
          throw new HandoverError(
            "The booking payment records are inconsistent. Contact support.",
          );
        }

        const hadCompletedPayment =
          Boolean(
            payment &&
              deposit,
          );

        if (
          hadCompletedPayment
        ) {
          await tx.transaction.updateMany({
            where: {
              rentalId,

              type:
                "RENTAL_PAYMENT",

              status:
                "COMPLETED",
            },

            data: {
              status:
                "REFUNDED",
            },
          });

          await tx.transaction.updateMany({
            where: {
              rentalId,

              type:
                "DEPOSIT_HOLD",

              status:
                "COMPLETED",
            },

            data: {
              status:
                "REFUNDED",
            },
          });

          const existingDepositRefund =
            await tx.transaction.findFirst({
              where: {
                rentalId,

                type:
                  "DEPOSIT_REFUND",

                status:
                  "COMPLETED",
              },

              select: {
                id: true,
              },
            });

          if (
            !existingDepositRefund
          ) {
            await tx.transaction.create({
              data: {
                rentalId,

                type:
                  "DEPOSIT_REFUND",

                amount:
                  rental.depositAmount,

                status:
                  "COMPLETED",

                paymentRef:
                  `SIMULATED-COLLECTION-CANCEL-${rentalId}`,
              },
            });
          }
        } else {
          /*
           * Legacy/unpaid booking:
           * close any unused placeholders.
           */
          await tx.transaction.updateMany({
            where: {
              rentalId,

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

        /*
         * Invalidate collection QR.
         */
        await resetCollectionHandover(
          tx,
          rentalId,
        );

        /*
         * Cancel rental.
         */
        await tx.rental.update({
          where: {
            id:
              rentalId,
          },

          data: {
            status:
              "CANCELLED",
          },
        });

        /*
         * IMPORTANT:
         *
         * Keep the reported device UNAVAILABLE.
         *
         * Since the renter reported a real device
         * issue, we should not automatically put it
         * back onto the marketplace.
         *
         * Owner can repair/edit the listing later.
         */
        await tx.device.updateMany({
          where: {
            id:
              rental.deviceId,

            ownerId:
              rental.ownerId,
          },

          data: {
            status:
              "UNAVAILABLE",
          },
        });

        await tx.collectionIssue.update({
          where: {
            id:
              issue.id,
          },

          data: {
            status:
              "RESOLVED",

            resolvedAt:
              new Date(),

            /*
             * No manual admin review needed because
             * our university demo simulates refund
             * automatically.
             */
            paymentReviewRequired:
              false,
          },
        });

        await audit(
          tx,
          actor.userId,
          issue.id,
          "COLLECTION_ISSUE_AGREED",
          {
            outcome:
              "CANCEL",

            paymentWasCompleted:
              hadCompletedPayment,

            simulatedRefund:
              hadCompletedPayment,

            rentalPayment:
              hadCompletedPayment
                ? "REFUNDED"
                : "NOT_CHARGED",

            deposit:
              hadCompletedPayment
                ? "REFUNDED"
                : "NOT_CHARGED",
          },
        );

        const message =
          hadCompletedPayment
            ? "The booking was cancelled. For this test project, the rental payment and security deposit have been marked as refunded."
            : "The booking was cancelled before payment was completed.";

        await notify(
          tx,
          rental.renterId,
          rentalId,
          "BOOKING_REFUNDED",
          hadCompletedPayment
            ? "Booking cancelled and refunded"
            : "Booking cancelled",
          message,
        );

        await notify(
          tx,
          rental.ownerId,
          rentalId,
          "BOOKING_REFUNDED",
          "Booking cancelled",
          hadCompletedPayment
            ? "The renter accepted cancellation. The test payment and security deposit were marked as refunded. No owner payout was created."
            : "The renter accepted cancellation. No payment was completed.",
        );

        return;
      }

      throw new HandoverError(
        "Invalid collection issue outcome.",
      );
    },
  );
}