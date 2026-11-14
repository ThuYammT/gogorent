import { Suspense } from "react";
import Link from "next/link";

import {
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  ReceiptText,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";

const PAGE_SIZE = 10;

type EarningsPageProps = {
  searchParams: Promise<{
    status?: string;
    page?: string;
  }>;
};

const statusFilters = [
  {
    label: "All",
    value: "ALL",
  },
  {
    label: "Completed",
    value: "COMPLETED",
  },
  {
    label: "Pending",
    value: "PENDING",
  },
  {
    label: "Failed",
    value: "FAILED",
  },
];

function transactionStatusStyle(
  status: string,
) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";

    case "PENDING":
      return "bg-amber-50 text-amber-700";

    case "FAILED":
      return "bg-red-50 text-red-700";

    case "REFUNDED":
      return "bg-blue-50 text-blue-700";

    default:
      return "bg-zinc-100 text-zinc-600";
  }
}

function formatStatus(
  status: string,
) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function createPageHref({
  page,
  status,
}: {
  page: number;
  status: string;
}) {
  const query =
    new URLSearchParams();

  if (status !== "ALL") {
    query.set(
      "status",
      status,
    );
  }

  if (page > 1) {
    query.set(
      "page",
      page.toString(),
    );
  }

  const queryString =
    query.toString();

  return queryString
    ? `/owner/earnings?${queryString}`
    : "/owner/earnings";
}

async function EarningsContent({
  searchParams,
}: EarningsPageProps) {
  const owner =
    await requireOwner();

  const params =
    await searchParams;

  const selectedStatus =
    statusFilters.some(
      (filter) =>
        filter.value ===
        params.status,
    )
      ? params.status!
      : "ALL";

  const requestedPage =
    Number(
      params.page ?? "1",
    );

  const currentPage =
    Number.isFinite(
      requestedPage,
    ) &&
    requestedPage > 0
      ? Math.floor(
          requestedPage,
        )
      : 1;

  const payoutWhere = {
    type:
      "OWNER_PAYOUT" as const,

    rental: {
      ownerId:
        owner.id,
    },

    ...(selectedStatus !==
    "ALL"
      ? {
          status:
            selectedStatus as
              | "COMPLETED"
              | "PENDING"
              | "FAILED",
        }
      : {}),
  };

  const [
    completedSummary,
    pendingSummary,
    completedCount,
    totalPayouts,
    filteredCount,
  ] =
    await Promise.all([
      prisma.transaction.aggregate({
        where: {
          type:
            "OWNER_PAYOUT",

          status:
            "COMPLETED",

          rental: {
            ownerId:
              owner.id,
          },
        },

        _sum: {
          amount:
            true,
        },
      }),

      prisma.transaction.aggregate({
        where: {
          type:
            "OWNER_PAYOUT",

          status:
            "PENDING",

          rental: {
            ownerId:
              owner.id,
          },
        },

        _sum: {
          amount:
            true,
        },
      }),

      prisma.transaction.count({
        where: {
          type:
            "OWNER_PAYOUT",

          status:
            "COMPLETED",

          rental: {
            ownerId:
              owner.id,
          },
        },
      }),

      prisma.transaction.count({
        where: {
          type:
            "OWNER_PAYOUT",

          rental: {
            ownerId:
              owner.id,
          },
        },
      }),

      prisma.transaction.count({
        where:
          payoutWhere,
      }),
    ]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredCount /
          PAGE_SIZE,
      ),
    );

  const safePage =
    Math.min(
      currentPage,
      totalPages,
    );

  const payouts =
    await prisma.transaction.findMany({
      where:
        payoutWhere,

      include: {
        rental: {
          include: {
            renter:
              true,

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
        },
      },

      orderBy: {
        createdAt:
          "desc",
      },

      skip:
        (safePage - 1) *
        PAGE_SIZE,

      take:
        PAGE_SIZE,
    });

  const totalEarnings =
    Number(
      completedSummary._sum
        .amount ?? 0,
    );

  const pendingPayout =
    Number(
      pendingSummary._sum
        .amount ?? 0,
    );

  const startItem =
    filteredCount === 0
      ? 0
      : (safePage - 1) *
          PAGE_SIZE +
        1;

  const endItem =
    Math.min(
      safePage * PAGE_SIZE,
      filteredCount,
    );

  return (
    <>
      {/* HEADER */}
      <header className="border-b border-zinc-200 bg-white px-6 py-8 md:px-10 xl:px-12">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-sm font-medium text-zinc-500">
            Financial overview
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
            Earnings
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Review your completed and pending owner payouts.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-6 py-8 md:px-10 xl:px-12">
        {/* STATS */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Total earnings
                </p>

                <p className="mt-3 text-3xl font-semibold text-zinc-950">
                  ฿
                  {totalEarnings.toLocaleString()}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <CircleDollarSign className="h-5 w-5 text-emerald-600" />
              </div>
            </div>

            <p className="mt-4 text-xs text-zinc-400">
              Completed owner payouts
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Pending payout
                </p>

                <p className="mt-3 text-3xl font-semibold text-zinc-950">
                  ฿
                  {pendingPayout.toLocaleString()}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <Clock3 className="h-5 w-5 text-amber-600" />
              </div>
            </div>

            <p className="mt-4 text-xs text-zinc-400">
              Waiting for completion
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Completed payouts
                </p>

                <p className="mt-3 text-3xl font-semibold text-zinc-950">
                  {completedCount}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
                <CheckCircle2 className="h-5 w-5 text-zinc-700" />
              </div>
            </div>

            <p className="mt-4 text-xs text-zinc-400">
              Successful transactions
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Payout records
                </p>

                <p className="mt-3 text-3xl font-semibold text-zinc-950">
                  {totalPayouts}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
                <ReceiptText className="h-5 w-5 text-zinc-700" />
              </div>
            </div>

            <p className="mt-4 text-xs text-zinc-400">
              All owner payout records
            </p>
          </div>
        </section>

        {/* HISTORY */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="flex flex-col justify-between gap-4 border-b border-zinc-100 px-6 py-5 md:flex-row md:items-center">
            <div>
              <h2 className="font-semibold text-zinc-950">
                Payout history
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Transactions generated from completed rentals.
              </p>
            </div>

            <div className="flex gap-1">
              {statusFilters.map(
                (filter) => (
                  <Link
                    key={
                      filter.value
                    }
                    href={createPageHref({
                      page: 1,
                      status:
                        filter.value,
                    })}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
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
                ),
              )}
            </div>
          </div>

          {payouts.length ===
          0 ? (
            <div className="px-6 py-20 text-center">
              <Banknote className="mx-auto h-9 w-9 text-zinc-300" />

              <h3 className="mt-4 font-semibold text-zinc-900">
                No payouts yet
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                Owner payout transactions will appear here when rentals generate earnings.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <div className="min-w-[850px]">
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] border-b border-zinc-100 bg-zinc-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    <span>
                      Rental
                    </span>

                    <span>
                      Renter
                    </span>

                    <span>
                      Amount
                    </span>

                    <span>
                      Status
                    </span>

                    <span className="text-right">
                      Date
                    </span>
                  </div>

                  <div className="divide-y divide-zinc-100">
                    {payouts.map(
                      (
                        payout,
                      ) => (
                        <div
                          key={
                            payout.id
                          }
                          className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center px-6 py-5"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                              {payout
                                .rental
                                .device
                                .images[0] ? (
                                <img
                                  src={
                                    payout
                                      .rental
                                      .device
                                      .images[0]
                                      .url
                                  }
                                  alt={
                                    payout
                                      .rental
                                      .device
                                      .name
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-lg">
                                  {payout
                                    .rental
                                    .device
                                    .emoji ??
                                    "📦"}
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-zinc-900">
                                {
                                  payout
                                    .rental
                                    .device
                                    .name
                                }
                              </p>

                              <p className="mt-1 text-xs text-zinc-400">
                                Rental #
                                {payout.rentalId.slice(
                                  -6,
                                )}
                              </p>
                            </div>
                          </div>

                          <p className="truncate text-sm text-zinc-600">
                            {
                              payout
                                .rental
                                .renter
                                .name
                            }
                          </p>

                          <p className="text-sm font-semibold text-zinc-950">
                            ฿
                            {Number(
                              payout.amount,
                            ).toLocaleString()}
                          </p>

                          <div>
                            <span
                              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${transactionStatusStyle(
                                payout.status,
                              )}`}
                            >
                              {formatStatus(
                                payout.status,
                              )}
                            </span>
                          </div>

                          <p className="text-right text-sm text-zinc-500">
                            {payout.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>

              {/* PAGINATION */}
              <div className="flex flex-col gap-4 border-t border-zinc-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-zinc-500">
                  Showing{" "}
                  <span className="font-medium text-zinc-900">
                    {startItem}
                  </span>
                  {" "}–{" "}
                  <span className="font-medium text-zinc-900">
                    {endItem}
                  </span>
                  {" "}of{" "}
                  <span className="font-medium text-zinc-900">
                    {filteredCount}
                  </span>
                </p>

                <div className="flex gap-2">
                  {safePage > 1 ? (
                    <Link
                      href={createPageHref({
                        page:
                          safePage -
                          1,

                        status:
                          selectedStatus,
                      })}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Link>
                  ) : (
                    <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-300">
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </span>
                  )}

                  {safePage <
                  totalPages ? (
                    <Link
                      href={createPageHref({
                        page:
                          safePage +
                          1,

                        status:
                          selectedStatus,
                      })}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-300">
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}

function EarningsLoading() {
  return (
    <div className="p-8 md:p-10">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map(
          (item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-2xl bg-white"
            />
          ),
        )}
      </div>

      <div className="mt-6 h-[420px] animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

export default function EarningsPage({
  searchParams,
}: EarningsPageProps) {
  return (
    <Suspense
      fallback={
        <EarningsLoading />
      }
    >
      <EarningsContent
        searchParams={
          searchParams
        }
      />
    </Suspense>
  );
}