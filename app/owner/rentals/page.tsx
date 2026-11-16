import {
  Suspense,
} from "react";

import Link from "next/link";

import {
  CalendarDays,
  Clock3,
  Package,
  UserRound,
} from "lucide-react";

import {
  prisma,
} from "@/lib/prisma";

import {
  requireOwner,
} from "@/lib/session";

import {
  cancelOwnerBooking,
} from "@/app/owner/requests/actions";

import CollectionQr from "@/components/owner/CollectionQr";
import ReturnQrScanner from "@/components/owner/ReturnQrScanner";

type RentalsPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const filters = [
  {
    label: "All",
    value: "ALL",
  },
  {
    label: "Approved",
    value: "APPROVED",
  },
  {
    label: "Active",
    value: "ACTIVE",
  },
  {
    label: "Returned",
    value: "RETURNED",
  },
  {
    label: "Completed",
    value: "COMPLETED",
  },
  {
    label: "Rejected",
    value: "REJECTED",
  },
  {
    label: "Cancelled",
    value: "CANCELLED",
  },
];

function statusStyle(
  status: string,
) {
  switch (status) {
    case "APPROVED":
      return "bg-indigo-50 text-indigo-700";

    case "ACTIVE":
      return "bg-blue-50 text-blue-700";

    case "RETURNED":
      return "bg-amber-50 text-amber-700";

    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";

    case "REJECTED":
      return "bg-red-50 text-red-700";

    case "CANCELLED":
      return "bg-zinc-100 text-zinc-600";

    case "DISPUTED":
      return "bg-orange-50 text-orange-700";

    default:
      return "bg-zinc-100 text-zinc-600";
  }
}

function formatStatus(
  status: string,
) {
  return status
    .replaceAll(
      "_",
      " ",
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

async function RentalsContent({
  searchParams,
}: RentalsPageProps) {
  const owner =
    await requireOwner();

  const params =
    await searchParams;

  const selectedStatus =
    filters.some(
      (filter) =>
        filter.value ===
        params.status,
    )
      ? params.status!
      : "ALL";

  const rentals =
    await prisma.rental.findMany({
      where: {
        ownerId:
          owner.id,

        status:
          selectedStatus !==
          "ALL"
            ? (selectedStatus as
                | "APPROVED"
                | "ACTIVE"
                | "RETURNED"
                | "COMPLETED"
                | "REJECTED"
                | "CANCELLED")
            : {
                not:
                  "REQUESTED",
              },
      },

      include: {
        renter:
          true,

        /*
         * IMPORTANT:
         * We need BOTH collection and return
         * handovers for Phase 3.
         */
        handovers: {
          select: {
            type: true,
            status: true,
          },
        },

        collectionIssues: {
          select: {
            status: true,
          },
        },

        transactions: {
          where: {
            type: {
              in: [
                "RENTAL_PAYMENT",
                "DEPOSIT_HOLD",
                "DEPOSIT_REFUND",
                "OWNER_PAYOUT",
                "PLATFORM_FEE",
              ],
            },
          },

          select: {
            type: true,
            status: true,
            paymentRef: true,
            amount: true,
            createdAt: true,
          },

          orderBy: {
            createdAt:
              "desc",
          },
        },

        device: {
          include: {
            images: {
              orderBy: [
                {
                  isPrimary:
                    "desc",
                },
                {
                  createdAt:
                    "asc",
                },
              ],

              take: 1,
            },
          },
        },
      },

      orderBy: {
        createdAt:
          "desc",
      },
    });

  return (
    <>
      <header className="border-b border-zinc-200 bg-white px-6 py-8 md:px-10 xl:px-12">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-sm font-medium text-zinc-500">
            Rental management
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
            Rentals
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Track payments, collection, active rentals, returns and settlements.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-6 py-8 md:px-10 xl:px-12">
        {/* FILTER */}
        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="flex gap-1 overflow-x-auto px-5 py-3">
            {filters.map(
              (filter) => {
                const href =
                  filter.value ===
                  "ALL"
                    ? "/owner/rentals"
                    : `/owner/rentals?status=${filter.value}`;

                return (
                  <Link
                    key={
                      filter.value
                    }
                    href={
                      href
                    }
                    className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                      selectedStatus ===
                      filter.value
                        ? "bg-zinc-950 text-white"
                        : "text-zinc-500 hover:bg-zinc-100"
                    }`}
                  >
                    {
                      filter.label
                    }
                  </Link>
                );
              },
            )}
          </div>
        </section>

        {rentals.length ===
        0 ? (
          <section className="mt-6 rounded-2xl border border-zinc-200 bg-white px-6 py-20 text-center">
            <Package className="mx-auto h-9 w-9 text-zinc-300" />

            <h2 className="mt-4 font-semibold text-zinc-900">
              No rentals found
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Rentals matching this status will appear here.
            </p>
          </section>
        ) : (
          <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            {/* TABLE HEADER */}
            <div className="hidden grid-cols-[2fr_1.2fr_1.3fr_1fr_1.7fr] border-b border-zinc-100 bg-zinc-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 lg:grid">
              <span>
                Device
              </span>

              <span>
                Renter
              </span>

              <span>
                Dates
              </span>

              <span>
                Amount
              </span>

              <span className="text-right">
                Status / Action
              </span>
            </div>

            <div className="divide-y divide-zinc-100">
              {rentals.map(
                (rental) => {
                  const rentalPaymentComplete =
                    rental.transactions.some(
                      (
                        transaction,
                      ) =>
                        transaction.type ===
                          "RENTAL_PAYMENT" &&
                        transaction.status ===
                          "COMPLETED",
                    );

                  const depositComplete =
                    rental.transactions.some(
                      (
                        transaction,
                      ) =>
                        transaction.type ===
                          "DEPOSIT_HOLD" &&
                        transaction.status ===
                          "COMPLETED",
                    );

                  const paymentComplete =
                    rentalPaymentComplete &&
                    depositComplete;

                  const paymentStarted =
                    rental.transactions.some(
                      (
                        transaction,
                      ) =>
                        Boolean(
                          transaction.paymentRef,
                        ) &&
                        transaction.status ===
                          "PENDING",
                    );

                  const hasOpenIssue =
                    rental.collectionIssues.some(
                      (
                        issue,
                      ) =>
                        issue.status !==
                        "RESOLVED",
                    );

                  const collectionScanned =
                    rental.handovers.some(
                      (
                        handover,
                      ) =>
                        handover.type ===
                          "COLLECTION" &&
                        (handover.status ===
                          "QR_SCANNED" ||
                          handover.status ===
                            "VERIFIED"),
                    );

                  const returnScanned =
                    rental.handovers.some(
                      (
                        handover,
                      ) =>
                        handover.type ===
                          "RETURN" &&
                        handover.status ===
                          "QR_SCANNED",
                    );

                  const depositRefund =
                    rental.transactions.find(
                      (
                        transaction,
                      ) =>
                        transaction.type ===
                        "DEPOSIT_REFUND",
                    );

                  const ownerPayout =
                    rental.transactions.find(
                      (
                        transaction,
                      ) =>
                        transaction.type ===
                        "OWNER_PAYOUT",
                    );

                  return (
                    <div
                      key={
                        rental.id
                      }
                      id={
                        rental.id
                      }
                      className="grid gap-5 px-6 py-5 lg:grid-cols-[2fr_1.2fr_1.3fr_1fr_1.7fr] lg:items-center"
                    >
                      {/* DEVICE */}
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                          {rental
                            .device
                            .images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={
                                rental
                                  .device
                                  .images[0]
                                  .url
                              }
                              alt={
                                rental
                                  .device
                                  .name
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xl">
                              {rental
                                .device
                                .emoji ??
                                "📦"}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-900">
                            {
                              rental
                                .device
                                .name
                            }
                          </p>

                          <p className="mt-1 text-xs text-zinc-400">
                            Rental #
                            {rental.id.slice(
                              -6,
                            )}
                          </p>
                        </div>
                      </div>

                      {/* RENTER */}
                      <div className="flex items-center gap-2">
                        <UserRound className="h-4 w-4 shrink-0 text-zinc-400" />

                        <span className="truncate text-sm text-zinc-600">
                          {
                            rental
                              .renter
                              .name
                          }
                        </span>
                      </div>

                      {/* DATES */}
                      <div className="flex gap-2">
                        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />

                        <div>
                          <p className="text-sm text-zinc-700">
                            {rental.startDate.toLocaleDateString()}
                            {" "}–{" "}
                            {rental.endDate.toLocaleDateString()}
                          </p>

                          <p className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
                            <Clock3 className="h-3 w-3" />

                            {
                              rental.totalDays
                            }{" "}
                            day
                            {rental.totalDays ===
                            1
                              ? ""
                              : "s"}
                          </p>
                        </div>
                      </div>

                      {/* AMOUNT */}
                      <div>
                        <p className="text-sm font-semibold text-zinc-950">
                          ฿
                          {Number(
                            rental.rentalAmount,
                          ).toLocaleString()}
                        </p>

                        <p className="mt-1 text-xs text-zinc-400">
                          + ฿
                          {Number(
                            rental.depositAmount,
                          ).toLocaleString()}{" "}
                          deposit
                        </p>
                      </div>

                      {/* STATUS / ACTION */}
                      <div className="lg:text-right">
                        <span
                          className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${statusStyle(
                            rental.status,
                          )}`}
                        >
                          {formatStatus(
                            rental.status,
                          )}
                        </span>

                        {/* APPROVED */}
                        {rental.status ===
                          "APPROVED" && (
                          <>
                            <div className="mt-2">
                              {paymentComplete ? (
                                <span className="inline-flex rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                  Payment completed
                                </span>
                              ) : paymentStarted ? (
                                <span className="inline-flex rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                  PromptPay pending
                                </span>
                              ) : (
                                <span className="inline-flex rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                  Awaiting payment
                                </span>
                              )}
                            </div>

                            {hasOpenIssue ? (
                              <p className="mt-3 text-xs font-semibold text-amber-700">
                                Collection paused for a device issue
                              </p>
                            ) : !paymentComplete ? (
                              <p className="mt-3 text-xs text-zinc-500">
                                Collection QR unlocks after payment.
                              </p>
                            ) : collectionScanned ? (
                              <p className="mt-3 text-xs font-semibold text-emerald-700">
                                Collection QR scanned
                              </p>
                            ) : (
                              <CollectionQr
                                rentalId={
                                  rental.id
                                }
                              />
                            )}

                            {!hasOpenIssue &&
                              !paymentComplete &&
                              !paymentStarted && (
                                <form
                                  action={cancelOwnerBooking.bind(
                                    null,
                                    rental.id,
                                  )}
                                  className="mt-2"
                                >
                                  <button
                                    type="submit"
                                    className="text-xs font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-900"
                                  >
                                    Cancel booking
                                  </button>
                                </form>
                              )}
                          </>
                        )}

                        {/* ACTIVE / RETURN */}
                        {rental.status ===
                          "ACTIVE" && (
                          <ReturnQrScanner
                            rentalId={
                              rental.id
                            }
                            alreadyScanned={
                              returnScanned
                            }
                          />
                        )}

                        {/* RETURNED */}
                        {rental.status ===
                          "RETURNED" && (
                          <div className="mt-3 space-y-1 text-xs">
                            <p className="font-semibold text-amber-700">
                              Settlement pending
                            </p>

                            <p className="text-zinc-500">
                              Deposit refund:{" "}
                              {depositRefund?.status ??
                                "PENDING"}
                            </p>

                            <p className="text-zinc-500">
                              Owner payout:{" "}
                              {ownerPayout?.status ??
                                "PENDING"}
                            </p>
                          </div>
                        )}

                        {/* COMPLETED */}
                        {rental.status ===
                          "COMPLETED" && (
                          <p className="mt-3 text-xs font-semibold text-emerald-700">
                            Return and settlement completed
                          </p>
                        )}

                        {rental
                          .collectionIssues
                          .length >
                          0 && (
                          <div className="mt-2">
                            <Link
                              href={`/owner/rentals/${rental.id}/issue`}
                              className="text-xs font-semibold text-amber-700 underline underline-offset-2"
                            >
                              {hasOpenIssue
                                ? "Review device issue"
                                : "View issue history"}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function RentalsLoading() {
  return (
    <div className="p-8 md:p-10">
      <div className="h-[500px] animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

export default function OwnerRentalsPage({
  searchParams,
}: RentalsPageProps) {
  return (
    <Suspense
      fallback={
        <RentalsLoading />
      }
    >
      <RentalsContent
        searchParams={
          searchParams
        }
      />
    </Suspense>
  );
}