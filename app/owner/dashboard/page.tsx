import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  ArrowRight,
  CalendarRange,
  CircleDollarSign,
  Clock3,
  Package,
  Plus,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

async function DashboardContent() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "OWNER") {
    redirect("/");
  }

  const ownerId = session.userId;

  const [
    deviceCount,
    pendingRequests,
    activeRentals,
    payoutSummary,
    recentRequests,
    recentDevices,
  ] = await Promise.all([
    prisma.device.count({
      where: {
        ownerId,
      },
    }),

    prisma.rental.count({
      where: {
        ownerId,
        status: "REQUESTED",
      },
    }),

    prisma.rental.count({
      where: {
        ownerId,
        status: "ACTIVE",
      },
    }),

    prisma.transaction.aggregate({
      where: {
        type: "OWNER_PAYOUT",
        status: "COMPLETED",

        rental: {
          ownerId,
        },
      },

      _sum: {
        amount: true,
      },
    }),

    prisma.rental.findMany({
      where: {
        ownerId,
        status: "REQUESTED",
      },

      include: {
        device: true,
        renter: true,
      },

      orderBy: {
        createdAt: "desc",
      },

      take: 4,
    }),

    prisma.device.findMany({
      where: {
        ownerId,
      },

      include: {
        category: true,
      },

      orderBy: {
        createdAt: "desc",
      },

      take: 4,
    }),
  ]);

  const totalEarnings = Number(
    payoutSummary._sum.amount ?? 0,
  );

  const stats = [
    {
      label: "Total listings",
      value: deviceCount.toString(),
      description:
        "Devices currently in your inventory",
      icon: Package,
    },

    {
      label: "Pending requests",
      value: pendingRequests.toString(),
      description:
        "Rental requests awaiting review",
      icon: Clock3,
    },

    {
      label: "Active rentals",
      value: activeRentals.toString(),
      description:
        "Devices currently being rented",
      icon: CalendarRange,
    },

    {
      label: "Total earnings",
      value: `฿${totalEarnings.toLocaleString()}`,
      description:
        "Completed owner payouts",
      icon: CircleDollarSign,
    },
  ];

  return (
    <>
      {/* HEADER */}
      <header className="flex flex-col gap-6 border-b border-zinc-200 bg-white px-6 py-8 md:px-10 xl:px-12">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Owner workspace
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950 md:text-4xl">
              Welcome back, {session.name}
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Here's what's happening with your
              listings and rentals.
            </p>
          </div>

          <Link
            href="/owner/devices/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
            Add new device
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-6 py-8 md:px-10 xl:px-12">
        {/* STATS */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-zinc-200 bg-white p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-500">
                      {stat.label}
                    </p>

                    <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
                      {stat.value}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
                    <Icon className="h-5 w-5 text-zinc-700" />
                  </div>
                </div>

                <p className="mt-4 text-xs leading-5 text-zinc-400">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </section>

        {/* MAIN GRID */}
        <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
          {/* REQUESTS */}
          <div className="rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
              <div>
                <h2 className="font-semibold text-zinc-950">
                  Rental requests
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Requests requiring your attention
                </p>
              </div>

              <Link
                href="/owner/requests"
                className="flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-950"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {recentRequests.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <Clock3 className="mx-auto h-8 w-8 text-zinc-300" />

                <p className="mt-4 font-medium text-zinc-700">
                  No pending requests
                </p>

                <p className="mt-1 text-sm text-zinc-400">
                  New rental requests will appear
                  here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {recentRequests.map(
                  (rental) => (
                    <div
                      key={rental.id}
                      className="flex items-center gap-4 px-6 py-5"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-xl">
                        {rental.device.emoji ??
                          "📦"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-zinc-900">
                          {rental.device.name}
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          {rental.renter.name} ·{" "}
                          {rental.startDate.toLocaleDateString()}{" "}
                          –{" "}
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
                  Latest devices you've added
                </p>
              </div>

              <Link
                href="/owner/devices"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-950"
              >
                Manage
              </Link>
            </div>

            {recentDevices.length === 0 ? (
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
                  (device) => (
                    <Link
                      key={device.id}
                      href={`/owner/devices/${device.id}`}
                      className="flex items-center gap-4 px-6 py-4 transition hover:bg-zinc-50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-lg">
                        {device.emoji ??
                          "📦"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-zinc-900">
                          {device.name}
                        </p>

                        <p className="mt-0.5 text-xs text-zinc-500">
                          {device.category.name}
                        </p>
                      </div>

                      <span
                        className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                          device.status ===
                          "AVAILABLE"
                            ? "bg-emerald-50 text-emerald-700"
                            : device.status ===
                                "PENDING_APPROVAL"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {device.status
                          .replaceAll("_", " ")
                          .toLowerCase()
                          .replace(
                            /\b\w/g,
                            (letter) =>
                              letter.toUpperCase(),
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
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-40 animate-pulse rounded-2xl bg-white"
          />
        ))}
      </div>
    </div>
  );
}

export default function OwnerDashboardPage() {
  return (
    <Suspense
      fallback={<DashboardLoading />}
    >
      <DashboardContent />
    </Suspense>
  );
}