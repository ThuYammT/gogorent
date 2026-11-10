import { Suspense } from "react";
import Link from "next/link";

import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  ReceiptText,
  Search,
  TriangleAlert,
} from "lucide-react";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 10;

type TransactionsPageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    status?: string;
    page?: string;
  }>;
};

const typeFilters = [
  "ALL",
  "RENTAL_PAYMENT",
  "DEPOSIT_HOLD",
  "DEPOSIT_REFUND",
  "OWNER_PAYOUT",
  "PLATFORM_FEE",
  "DAMAGE_CHARGE",
] as const;

const statusFilters = [
  "ALL",
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
] as const;

function formatValue(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function statusStyle(status: string) {
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

function typeStyle(type: string) {
  switch (type) {
    case "RENTAL_PAYMENT":
      return "bg-indigo-50 text-indigo-700";

    case "DEPOSIT_HOLD":
      return "bg-amber-50 text-amber-700";

    case "DEPOSIT_REFUND":
      return "bg-blue-50 text-blue-700";

    case "OWNER_PAYOUT":
      return "bg-emerald-50 text-emerald-700";

    case "PLATFORM_FEE":
      return "bg-zinc-100 text-zinc-700";

    case "DAMAGE_CHARGE":
      return "bg-red-50 text-red-700";

    default:
      return "bg-zinc-100 text-zinc-600";
  }
}

function createHref({
  q,
  type,
  status,
  page,
}: {
  q: string;
  type: string;
  status: string;
  page: number;
}) {
  const params =
    new URLSearchParams();

  if (q) {
    params.set("q", q);
  }

  if (type !== "ALL") {
    params.set(
      "type",
      type,
    );
  }

  if (status !== "ALL") {
    params.set(
      "status",
      status,
    );
  }

  if (page > 1) {
    params.set(
      "page",
      String(page),
    );
  }

  const query =
    params.toString();

  return query
    ? `/admin/transactions?${query}`
    : "/admin/transactions";
}

async function TransactionsContent({
  searchParams,
}: TransactionsPageProps) {
  await requireAdmin();

  const params =
    await searchParams;

  const q =
    params.q?.trim() ??
    "";

  const selectedType =
    typeFilters.includes(
      params.type as
        (typeof typeFilters)[number],
    )
      ? params.type!
      : "ALL";

  const selectedStatus =
    statusFilters.includes(
      params.status as
        (typeof statusFilters)[number],
    )
      ? params.status!
      : "ALL";

  const rawPage =
    Number(
      params.page ?? "1",
    );

  const page =
    Number.isFinite(rawPage) &&
    rawPage > 0
      ? Math.floor(rawPage)
      : 1;

  const where = {
    ...(selectedType !==
    "ALL"
      ? {
          type:
            selectedType as
              | "RENTAL_PAYMENT"
              | "DEPOSIT_HOLD"
              | "DEPOSIT_REFUND"
              | "OWNER_PAYOUT"
              | "PLATFORM_FEE"
              | "DAMAGE_CHARGE",
        }
      : {}),

    ...(selectedStatus !==
    "ALL"
      ? {
          status:
            selectedStatus as
              | "PENDING"
              | "COMPLETED"
              | "FAILED"
              | "REFUNDED",
        }
      : {}),

    ...(q
      ? {
          OR: [
            {
              rental: {
                device: {
                  name: {
                    contains:
                      q,
                    mode:
                      "insensitive" as const,
                  },
                },
              },
            },
            {
              rental: {
                renter: {
                  name: {
                    contains:
                      q,
                    mode:
                      "insensitive" as const,
                  },
                },
              },
            },
            {
              rental: {
                owner: {
                  name: {
                    contains:
                      q,
                    mode:
                      "insensitive" as const,
                  },
                },
              },
            },
          ],
        }
      : {}),
  };

  const [
    total,
    completedSummary,
    pendingSummary,
    failedCount,
  ] =
    await Promise.all([
      prisma.transaction.count({
        where,
      }),

      prisma.transaction.aggregate({
        where: {
          status:
            "COMPLETED",
        },

        _sum: {
          amount:
            true,
        },
      }),

      prisma.transaction.aggregate({
        where: {
          status:
            "PENDING",
        },

        _sum: {
          amount:
            true,
        },
      }),

      prisma.transaction.count({
        where: {
          status:
            "FAILED",
        },
      }),
    ]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        total /
          PAGE_SIZE,
      ),
    );

  const safePage =
    Math.min(
      page,
      totalPages,
    );

  const transactions =
    await prisma.transaction.findMany({
      where,

      include: {
        rental: {
          include: {
            device:
              true,

            renter: {
              select: {
                name:
                  true,

                email:
                  true,
              },
            },

            owner: {
              select: {
                name:
                  true,

                email:
                  true,
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

  const completedAmount =
    Number(
      completedSummary._sum
        .amount ?? 0,
    );

  const pendingAmount =
    Number(
      pendingSummary._sum
        .amount ?? 0,
    );

  const start =
    total === 0
      ? 0
      : (safePage - 1) *
          PAGE_SIZE +
        1;

  const end =
    Math.min(
      safePage *
        PAGE_SIZE,
      total,
    );

  return (
    <>
      {/* HEADER */}
      <header className="border-b border-zinc-200 bg-white px-6 py-8 md:px-10 xl:px-12">
        <div className="mx-auto max-w-[1500px]">
          <p className="text-sm font-medium text-zinc-500">
            Financial monitoring
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
            Transactions
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Monitor rental payments, deposits, payouts and platform fees.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-6 py-8 md:px-10 xl:px-12">
        {/* STATS */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Transaction records
                </p>

                <p className="mt-3 text-3xl font-semibold">
                  {total}
                </p>
              </div>

              <ReceiptText className="h-5 w-5 text-zinc-400" />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Completed value
                </p>

                <p className="mt-3 text-3xl font-semibold">
                  ฿
                  {completedAmount.toLocaleString()}
                </p>
              </div>

              <CircleDollarSign className="h-5 w-5 text-emerald-500" />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Pending value
                </p>

                <p className="mt-3 text-3xl font-semibold">
                  ฿
                  {pendingAmount.toLocaleString()}
                </p>
              </div>

              <Clock3 className="h-5 w-5 text-amber-500" />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Failed transactions
                </p>

                <p className="mt-3 text-3xl font-semibold">
                  {failedCount}
                </p>
              </div>

              <TriangleAlert className="h-5 w-5 text-red-500" />
            </div>
          </div>
        </section>

        {/* FILTERS */}
        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 p-5">
            <form className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

              <input
                name="q"
                defaultValue={q}
                placeholder="Search device, renter or owner..."
                className="w-full rounded-lg border border-zinc-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-zinc-400"
              />

              {selectedType !==
                "ALL" && (
                <input
                  type="hidden"
                  name="type"
                  value={
                    selectedType
                  }
                />
              )}

              {selectedStatus !==
                "ALL" && (
                <input
                  type="hidden"
                  name="status"
                  value={
                    selectedStatus
                  }
                />
              )}
            </form>
          </div>

          {/* TYPE */}
          <div className="flex gap-1 overflow-x-auto px-5 pt-3">
            {typeFilters.map(
              (filter) => (
                <Link
                  key={filter}
                  href={createHref({
                    q,
                    type:
                      filter,
                    status:
                      selectedStatus,
                    page: 1,
                  })}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                    selectedType ===
                    filter
                      ? "bg-zinc-950 text-white"
                      : "text-zinc-500 hover:bg-zinc-100"
                  }`}
                >
                  {filter ===
                  "ALL"
                    ? "All types"
                    : formatValue(
                        filter,
                      )}
                </Link>
              ),
            )}
          </div>

          {/* STATUS */}
          <div className="flex gap-1 overflow-x-auto px-5 pb-3">
            {statusFilters.map(
              (filter) => (
                <Link
                  key={filter}
                  href={createHref({
                    q,
                    type:
                      selectedType,
                    status:
                      filter,
                    page: 1,
                  })}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium ${
                    selectedStatus ===
                    filter
                      ? "bg-zinc-200 text-zinc-950"
                      : "text-zinc-400 hover:bg-zinc-100"
                  }`}
                >
                  {filter ===
                  "ALL"
                    ? "All status"
                    : formatValue(
                        filter,
                      )}
                </Link>
              ),
            )}
          </div>
        </section>

        {/* TABLE */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          {transactions.length ===
          0 ? (
            <div className="py-20 text-center">
              <Banknote className="mx-auto h-9 w-9 text-zinc-300" />

              <h2 className="mt-4 font-semibold">
                No transactions found
              </h2>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <div className="min-w-[1100px]">
                  <div className="grid grid-cols-[1.5fr_1.5fr_1.1fr_1fr_1fr_.9fr] border-b border-zinc-100 bg-zinc-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    <span>
                      Transaction
                    </span>

                    <span>
                      Rental
                    </span>

                    <span>
                      Amount
                    </span>

                    <span>
                      Type
                    </span>

                    <span>
                      Status
                    </span>

                    <span className="text-right">
                      Date
                    </span>
                  </div>

                  <div className="divide-y divide-zinc-100">
                    {transactions.map(
                      (
                        transaction,
                      ) => (
                        <div
                          key={
                            transaction.id
                          }
                          className="grid grid-cols-[1.5fr_1.5fr_1.1fr_1fr_1fr_.9fr] items-center px-6 py-5"
                        >
                          <div>
                            <p className="text-sm font-semibold text-zinc-950">
                              #
                              {transaction.id.slice(
                                -8,
                              )}
                            </p>

                            <p className="mt-1 text-xs text-zinc-400">
                              Rental #
                              {transaction.rentalId.slice(
                                -6,
                              )}
                            </p>
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {
                                transaction
                                  .rental
                                  .device
                                  .name
                              }
                            </p>

                            <p className="mt-1 truncate text-xs text-zinc-400">
                              {
                                transaction
                                  .rental
                                  .renter
                                  .name
                              }{" "}
                              →{" "}
                              {
                                transaction
                                  .rental
                                  .owner
                                  .name
                              }
                            </p>
                          </div>

                          <p className="text-sm font-semibold text-zinc-950">
                            ฿
                            {Number(
                              transaction.amount,
                            ).toLocaleString()}
                          </p>

                          <div>
                            <span
                              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${typeStyle(
                                transaction.type,
                              )}`}
                            >
                              {formatValue(
                                transaction.type,
                              )}
                            </span>
                          </div>

                          <div>
                            <span
                              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${statusStyle(
                                transaction.status,
                              )}`}
                            >
                              {formatValue(
                                transaction.status,
                              )}
                            </span>
                          </div>

                          <p className="text-right text-sm text-zinc-500">
                            {transaction.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>

              {/* PAGINATION */}
              <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-4">
                <p className="text-sm text-zinc-500">
                  Showing{" "}
                  <b className="text-zinc-900">
                    {start}
                  </b>
                  {" "}–{" "}
                  <b className="text-zinc-900">
                    {end}
                  </b>
                  {" "}of{" "}
                  <b className="text-zinc-900">
                    {total}
                  </b>
                </p>

                <div className="flex gap-2">
                  {safePage > 1 ? (
                    <Link
                      href={createHref({
                        q,
                        type:
                          selectedType,
                        status:
                          selectedStatus,
                        page:
                          safePage -
                          1,
                      })}
                      className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-300">
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </span>
                  )}

                  {safePage <
                  totalPages ? (
                    <Link
                      href={createHref({
                        q,
                        type:
                          selectedType,
                        status:
                          selectedStatus,
                        page:
                          safePage +
                          1,
                      })}
                      className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-300">
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

function TransactionsLoading() {
  return (
    <div className="p-10">
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

      <div className="mt-6 h-[550px] animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

export default function AdminTransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  return (
    <Suspense
      fallback={
        <TransactionsLoading />
      }
    >
      <TransactionsContent
        searchParams={
          searchParams
        }
      />
    </Suspense>
  );
}