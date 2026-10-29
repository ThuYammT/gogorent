import { Suspense } from "react";
import Link from "next/link";

import {
  ArrowRight,
  CalendarRange,
  CircleDollarSign,
  Clock3,
  Package,
  Plus,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";

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

function listingStatusStyle(
  status: string,
) {
  switch (status) {
    case "AVAILABLE":
      return "bg-emerald-50 text-emerald-700";

    case "PENDING_APPROVAL":
      return "bg-amber-50 text-amber-700";

    case "RENTED":
      return "bg-blue-50 text-blue-700";

    case "REJECTED":
      return "bg-red-50 text-red-700";

    default:
      return "bg-zinc-100 text-zinc-600";
  }
}

async function DashboardContent() {
  const owner =
    await requireOwner();

  const ownerId =
    owner.id;

  const [
    deviceCount,
    pendingRequests,
    activeRentals,
    payoutSummary,
    recentRequests,
    recentDevices,
    listingStatusCounts,
  ] =
    await Promise.all([
      prisma.device.count({
        where: {
          ownerId,
        },
      }),

      prisma.rental.count({
        where: {
          ownerId,
          status:
            "REQUESTED",
        },
      }),

      prisma.rental.count({
        where: {
          ownerId,
          status:
            "ACTIVE",
        },
      }),

      prisma.transaction.aggregate({
        where: {
          type:
            "OWNER_PAYOUT",

          status:
            "COMPLETED",

          rental: {
            ownerId,
          },
        },

        _sum: {
          amount:
            true,
        },
      }),

      prisma.rental.findMany({
        where: {
          ownerId,

          status:
            "REQUESTED",
        },

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

        orderBy: {
          createdAt:
            "desc",
        },

        take: 4,
      }),

      prisma.device.findMany({
        where: {
          ownerId,
        },

        include: {
          category:
            true,

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

        orderBy: {
          createdAt:
            "desc",
        },

        take: 4,
      }),

      prisma.device.groupBy({
        by: ["status"],

        where: {
          ownerId,
        },

        _count: {
          _all:
            true,
        },
      }),
    ]);

  const totalEarnings =
    Number(
      payoutSummary._sum
        .amount ?? 0,
    );

  function countStatus(
    status: string,
  ) {
    return (
      listingStatusCounts.find(
        (item) =>
          item.status ===
          status,
      )?._count._all ??
      0
    );
  }

  const availableCount =
    countStatus(
      "AVAILABLE",
    );

  const pendingCount =
    countStatus(
      "PENDING_APPROVAL",
    );

  const rentedCount =
    countStatus(
      "RENTED",
    );

  const rejectedCount =
    countStatus(
      "REJECTED",
    );

  const stats = [
    {
      label:
        "Total listings",

      value:
        deviceCount.toString(),

      description:
        `${availableCount} currently available`,

      icon:
        Package,
    },

    {
      label:
        "Pending requests",

      value:
        pendingRequests.toString(),

      description:
        pendingRequests > 0
          ? "Require your attention"
          : "No requests awaiting review",

      icon:
        Clock3,
    },

    {
      label:
        "Active rentals",

      value:
        activeRentals.toString(),

      description:
        "Devices currently being rented",

      icon:
        CalendarRange,
    },

    {
      label:
        "Total earnings",

      value:
        `฿${totalEarnings.toLocaleString()}`,

      description:
        "Completed owner payouts",

      icon:
        CircleDollarSign,
    },
  ];

  const listingOverview = [
    {
      label:
        "Available",

      value:
        availableCount,

      className:
        "bg-emerald-500",
    },

    {
      label:
        "Pending approval",

      value:
        pendingCount,

      className:
        "bg-amber-500",
    },

    {
      label:
        "Rented",

      value:
        rentedCount,

      className:
        "bg-blue-500",
    },

    {
      label:
        "Rejected",

      value:
        rejectedCount,

      className:
        "bg-red-500",
    },
  ];

  return (
    <>
      {/* HEADER */}
      <header className="border-b border-zinc-200 bg-white px-6 py-8 md:px-10 xl:px-12">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Owner workspace
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950 md:text-4xl">
              Welcome back,{" "}
              {owner.name}
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Here's an overview of
              your listings, rental
              activity and earnings.
            </p>
          </div>

          <Link
            href="/owner/devices/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />

            Add new device
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-6 py-8 md:px-10 xl:px-12">
        {/* STATS */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(
            (stat) => {
              const Icon =
                stat.icon;

              return (
                <div
                  key={
                    stat.label
                  }
                  className="rounded-2xl border border-zinc-200 bg-white p-6"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-500">
                        {
                          stat.label
                        }
                      </p>

                      <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
                        {
                          stat.value
                        }
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
                      <Icon className="h-5 w-5 text-zinc-700" />
                    </div>
                  </div>

                  <p className="mt-4 text-xs leading-5 text-zinc-400">
                    {
                      stat.description
                    }
                  </p>
                </div>
              );
            },
          )}
        </section>

        {/* LISTING OVERVIEW */}
        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
            <div>
              <h2 className="font-semibold text-zinc-950">
                Listing overview
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Current status of your
                device inventory
              </p>
            </div>

            <Link
              href="/owner/devices"
              className="flex items-center gap-1 text-sm font-medium text-zinc-600 transition hover:text-zinc-950"
            >
              Manage devices

              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid divide-y divide-zinc-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
            {listingOverview.map(
              (item) => (
                <div
                  key={
                    item.label
                  }
                  className="p-6"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${item.className}`}
                    />

                    <p className="text-sm font-medium text-zinc-500">
                      {
                        item.label
                      }
                    </p>
                  </div>

                  <p className="mt-3 text-2xl font-semibold text-zinc-950">
                    {
                      item.value
                    }
                  </p>
                </div>
              ),
            )}
          </div>
        </section>

        {/* LOWER GRID */}
        <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
          {/* REQUESTS */}
          <div className="rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
              <div>
                <h2 className="font-semibold text-zinc-950">
                  Rental requests
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Requests requiring
                  your attention
                </p>
              </div>

              <Link
                href="/owner/requests"
                className="flex items-center gap-1 text-sm font-medium text-zinc-600 transition hover:text-zinc-950"
              >
                View all

                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {recentRequests.length ===
            0 ? (
              <div className="px-6 py-14 text-center">
                <Clock3 className="mx-auto h-8 w-8 text-zinc-300" />

                <p className="mt-4 font-medium text-zinc-700">
                  No pending requests
                </p>

                <p className="mt-1 text-sm text-zinc-400">
                  New rental requests
                  will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {recentRequests.map(
                  (
                    rental,
                  ) => (
                    <div
                      key={
                        rental.id
                      }
                      className="flex items-center gap-4 px-6 py-5"
                    >
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
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

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-zinc-900">
                          {
                            rental
                              .device
                              .name
                          }
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          {
                            rental
                              .renter
                              .name
                          }{" "}
                          ·{" "}
                          {rental.startDate.toLocaleDateString()}
                          {" "}–{" "}
                          {rental.endDate.toLocaleDateString()}
                        </p>
                      </div>

                      <Link
                        href="/owner/requests"
                        className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                      >
                        Review
                      </Link>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          {/* RECENT LISTINGS */}
          <div className="rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
              <div>
                <h2 className="font-semibold text-zinc-950">
                  Recent listings
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Latest devices
                  you've added
                </p>
              </div>

              <Link
                href="/owner/devices"
                className="text-sm font-medium text-zinc-600 transition hover:text-zinc-950"
              >
                Manage
              </Link>
            </div>

            {recentDevices.length ===
            0 ? (
              <div className="px-6 py-14 text-center">
                <Package className="mx-auto h-8 w-8 text-zinc-300" />

                <p className="mt-4 font-medium text-zinc-700">
                  No listings yet
                </p>

                <Link
                  href="/owner/devices/new"
                  className="mt-2 inline-block text-sm font-medium text-amber-600"
                >
                  Add your first device
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {recentDevices.map(
                  (
                    device,
                  ) => (
                    <Link
                      key={
                        device.id
                      }
                      href={`/owner/devices/${device.id}`}
                      className="flex items-center gap-4 px-6 py-4 transition hover:bg-zinc-50"
                    >
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                        {device
                          .images[0] ? (
                          <img
                            src={
                              device
                                .images[0]
                                .url
                            }
                            alt={
                              device.name
                            }
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-lg">
                            {device.emoji ??
                              "📦"}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-zinc-900">
                          {
                            device.name
                          }
                        </p>

                        <p className="mt-0.5 text-xs text-zinc-500">
                          {
                            device
                              .category
                              .name
                          }
                        </p>
                      </div>

                      <span
                        className={`rounded-md px-2 py-1 text-[11px] font-semibold ${listingStatusStyle(
                          device.status,
                        )}`}
                      >
                        {formatStatus(
                          device.status,
                        )}
                      </span>
                    </Link>
                  ),
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function DashboardLoading() {
  return (
    <div className="p-10">
      <div className="h-12 w-72 animate-pulse rounded-lg bg-zinc-200" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map(
          (item) => (
            <div
              key={
                item
              }
              className="h-40 animate-pulse rounded-2xl bg-white"
            />
          ),
        )}
      </div>

      <div className="mt-6 h-40 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

export default function OwnerDashboardPage() {
  return (
    <Suspense
      fallback={
        <DashboardLoading />
      }
    >
      <DashboardContent />
    </Suspense>
  );
}