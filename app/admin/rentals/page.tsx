import { Suspense } from "react";
import Link from "next/link";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Package,
  Search,
  UserRound,
} from "lucide-react";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 10;

type RentalsPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
  }>;
};

const statusFilters = [
  "ALL",
  "REQUESTED",
  "APPROVED",
  "REJECTED",
  "ACTIVE",
  "RETURNED",
  "COMPLETED",
  "CANCELLED",
  "DISPUTED",
] as const;

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function statusStyle(status: string) {
  switch (status) {
    case "REQUESTED":
      return "bg-amber-50 text-amber-700";

    case "APPROVED":
      return "bg-indigo-50 text-indigo-700";

    case "ACTIVE":
      return "bg-blue-50 text-blue-700";

    case "RETURNED":
      return "bg-orange-50 text-orange-700";

    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";

    case "REJECTED":
      return "bg-red-50 text-red-700";

    case "CANCELLED":
      return "bg-zinc-100 text-zinc-600";

    case "DISPUTED":
      return "bg-rose-50 text-rose-700";

    default:
      return "bg-zinc-100 text-zinc-600";
  }
}

function createHref({
  q,
  status,
  page,
}: {
  q: string;
  status: string;
  page: number;
}) {
  const params =
    new URLSearchParams();

  if (q) {
    params.set("q", q);
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
    ? `/admin/rentals?${query}`
    : "/admin/rentals";
}

async function RentalsContent({
  searchParams,
}: RentalsPageProps) {
  await requireAdmin();

  const params =
    await searchParams;

  const q =
    params.q?.trim() ??
    "";

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
    ...(selectedStatus !==
    "ALL"
      ? {
          status:
            selectedStatus as
              | "REQUESTED"
              | "APPROVED"
              | "REJECTED"
              | "ACTIVE"
              | "RETURNED"
              | "COMPLETED"
              | "CANCELLED"
              | "DISPUTED",
        }
      : {}),

    ...(q
      ? {
          OR: [
            {
              device: {
                name: {
                  contains:
                    q,
                  mode:
                    "insensitive" as const,
                },
              },
            },
            {
              renter: {
                name: {
                  contains:
                    q,
                  mode:
                    "insensitive" as const,
                },
              },
            },
            {
              owner: {
                name: {
                  contains:
                    q,
                  mode:
                    "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
  };

  const total =
    await prisma.rental.count({
      where,
    });

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

  const rentals =
    await prisma.rental.findMany({
      where,

      include: {
        renter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        owner: {
          select: {
            id: true,
            name: true,
            email: true,
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

      skip:
        (safePage - 1) *
        PAGE_SIZE,

      take:
        PAGE_SIZE,
    });

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
            Platform management
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
            Rentals
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Monitor rental activity across all owners and renters.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-6 py-8 md:px-10 xl:px-12">
        {/* SEARCH + FILTER */}
        <section className="rounded-2xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 p-5">
            <form className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

              <input
                name="q"
                defaultValue={q}
                placeholder="Search device, renter or owner..."
                className="w-full rounded-lg border border-zinc-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-zinc-400"
              />

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

          <div className="flex gap-1 overflow-x-auto px-5 py-3">
            {statusFilters.map(
              (filter) => (
                <Link
                  key={filter}
                  href={createHref({
                    q,
                    status:
                      filter,
                    page: 1,
                  })}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                    selectedStatus ===
                    filter
                      ? "bg-zinc-950 text-white"
                      : "text-zinc-500 hover:bg-zinc-100"
                  }`}
                >
                  {filter ===
                  "ALL"
                    ? "All"
                    : formatStatus(
                        filter,
                      )}
                </Link>
              ),
            )}
          </div>
        </section>

        {/* TABLE */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          {rentals.length ===
          0 ? (
            <div className="py-20 text-center">
              <Package className="mx-auto h-9 w-9 text-zinc-300" />

              <h2 className="mt-4 font-semibold text-zinc-900">
                No rentals found
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Rentals matching your filters will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <div className="min-w-[1100px]">
                  <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1.5fr_1fr_.9fr] border-b border-zinc-100 bg-zinc-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    <span>
                      Device
                    </span>

                    <span>
                      Renter
                    </span>

                    <span>
                      Owner
                    </span>

                    <span>
                      Rental period
                    </span>

                    <span>
                      Amount
                    </span>

                    <span className="text-right">
                      Status
                    </span>
                  </div>

                  <div className="divide-y divide-zinc-100">
                    {rentals.map(
                      (rental) => (
                        <div
                          key={
                            rental.id
                          }
                          className="grid grid-cols-[2fr_1.2fr_1.2fr_1.5fr_1fr_.9fr] items-center px-6 py-5"
                        >
                          {/* DEVICE */}
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                              {rental
                                .device
                                .images[0] ? (
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
                              <p className="truncate text-sm font-semibold text-zinc-950">
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
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <UserRound className="h-4 w-4 shrink-0 text-zinc-400" />

                              <span className="truncate text-sm font-medium text-zinc-700">
                                {
                                  rental
                                    .renter
                                    .name
                                }
                              </span>
                            </div>

                            <p className="mt-1 truncate text-xs text-zinc-400">
                              {
                                rental
                                  .renter
                                  .email
                              }
                            </p>
                          </div>

                          {/* OWNER */}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-zinc-700">
                              {
                                rental
                                  .owner
                                  .name
                              }
                            </p>

                            <p className="mt-1 truncate text-xs text-zinc-400">
                              {
                                rental
                                  .owner
                                  .email
                              }
                            </p>
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

                          {/* STATUS */}
                          <div className="text-right">
                            <span
                              className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${statusStyle(
                                rental.status,
                              )}`}
                            >
                              {formatStatus(
                                rental.status,
                              )}
                            </span>
                          </div>
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

function RentalsLoading() {
  return (
    <div className="p-10">
      <div className="h-[550px] animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

export default function AdminRentalsPage({
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