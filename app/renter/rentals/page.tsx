import {
  Suspense,
} from "react";

import Link from "next/link";

import {
  CalendarDays,
  Clock3,
  MapPin,
  Package,
  Receipt,
} from "lucide-react";

import {
  prisma,
} from "@/lib/prisma";

import {
  requireRenter,
} from "@/lib/session";

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
    label: "Requested",
    value: "REQUESTED",
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
    label: "Cancelled",
    value: "CANCELLED",
  },
];

function statusStyle(
  status: string,
) {
  switch (status) {
    case "REQUESTED":
      return "bg-amber-50 text-amber-700";

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
    .replaceAll("_", " ")
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
  const renter =
    await requireRenter();

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
        renterId:
          renter.id,

        ...(selectedStatus !==
        "ALL"
          ? {
              status:
                selectedStatus as
                  | "REQUESTED"
                  | "APPROVED"
                  | "ACTIVE"
                  | "RETURNED"
                  | "COMPLETED"
                  | "CANCELLED",
            }
          : {}),
      },

      include: {
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

        transactions: {
          where: {
            type: {
              in: [
                "RENTAL_PAYMENT",
                "DEPOSIT_HOLD",
                "DEPOSIT_REFUND",
              ],
            },
          },

          select: {
            type: true,
            status: true,
            paymentRef: true,
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
      {/* HEADER */}
      <header className="border-b border-zinc-200 bg-white px-6 py-8 md:px-10 xl:px-12">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-sm font-medium text-zinc-500">
            Rental activity
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
            My bookings
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Track your requests, payments, active rentals and completed bookings.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-8 md:px-10 xl:px-12">
        {/* FILTERS */}
        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="flex gap-1 overflow-x-auto px-5 py-3">
            {filters.map(
              (filter) => {
                const href =
                  filter.value ===
                  "ALL"
                    ? "/renter/rentals"
                    : `/renter/rentals?status=${filter.value}`;

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
              No bookings found
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              {selectedStatus ===
              "ALL"
                ? "Your rental bookings will appear here."
                : "No bookings match this status."}
            </p>

            <Link
              href="/devices"
              className="mt-5 inline-flex rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Browse marketplace
            </Link>
          </section>
        ) : (
          <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            {/* DESKTOP HEADER */}
            <div className="hidden grid-cols-[2fr_1.3fr_1.3fr_1fr_1fr] border-b border-zinc-100 bg-zinc-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 lg:grid">
              <span>
                Device
              </span>

              <span>
                Dates
              </span>

              <span>
                Location
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
                (rental) => {
                  const image =
                    rental.device
                      .images[0];

                  const paymentComplete =
                    rental.transactions.some(
                      (
                        transaction,
                      ) =>
                        transaction.type ===
                          "RENTAL_PAYMENT" &&
                        transaction.status ===
                          "COMPLETED",
                    ) &&
                    rental.transactions.some(
                      (
                        transaction,
                      ) =>
                        transaction.type ===
                          "DEPOSIT_HOLD" &&
                        transaction.status ===
                          "COMPLETED",
                    );

                  const refund =
                    rental.transactions.find(
                      (
                        transaction,
                      ) =>
                        transaction.type ===
                        "DEPOSIT_REFUND",
                    );

                  return (
                    <Link
                      key={
                        rental.id
                      }
                      href={`/renter/rentals/${rental.id}`}
                      className="grid gap-5 px-6 py-5 transition hover:bg-zinc-50 lg:grid-cols-[2fr_1.3fr_1.3fr_1fr_1fr] lg:items-center"
                    >
                      {/* DEVICE */}
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                          {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={
                                image.url
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
                            Booking #
                            {rental.id.slice(
                              -6,
                            )}
                          </p>
                        </div>
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
                            {rental.totalDays ===
                            1
                              ? "day"
                              : "days"}
                          </p>
                        </div>
                      </div>

                      {/* LOCATION */}
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-zinc-400" />

                        <p className="truncate text-sm text-zinc-600">
                          {rental
                            .device
                            .location ??
                            "Not specified"}
                        </p>
                      </div>

                      {/* AMOUNT */}
                      <div>
                        <p className="text-sm font-semibold text-zinc-950">
                          ฿
                          {Number(
                            rental.rentalAmount,
                          ).toLocaleString()}
                        </p>

                        <p className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
                          <Receipt className="h-3 w-3" />

                          + ฿
                          {Number(
                            rental.depositAmount,
                          ).toLocaleString()}{" "}
                          deposit
                        </p>
                      </div>

                      {/* STATUS */}
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

                        {rental.status ===
                          "APPROVED" && (
                          <div className="mt-2">
                            {paymentComplete ? (
                              <span className="text-xs font-semibold text-emerald-700">
                                Payment completed
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-amber-700">
                                Payment required
                              </span>
                            )}
                          </div>
                        )}

                        {rental.status ===
                          "RETURNED" && (
                          <p className="mt-2 text-xs font-medium text-amber-700">
                            {refund?.status ===
                            "COMPLETED"
                              ? "Deposit refunded"
                              : "Settlement pending"}
                          </p>
                        )}

                        {rental.status ===
                          "COMPLETED" && (
                          <p className="mt-2 text-xs font-medium text-emerald-700">
                            Settlement completed
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                },
              )}
            </div>
          </section>
        )}
      </main>
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

export default function RenterRentalsPage({
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