import Link from "next/link";
import { Suspense } from "react";

import {
  ArrowRight,
  CalendarDays,
  Clock3,
  PackageCheck,
  Search,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireRenter } from "@/lib/session";

function statusStyle(
  status: string,
) {
  switch (status) {
    case "APPROVED":
      return "bg-indigo-50 text-indigo-700";

    case "ACTIVE":
      return "bg-blue-50 text-blue-700";

    case "COMPLETED":
    case "RETURNED":
      return "bg-emerald-50 text-emerald-700";

    case "REJECTED":
      return "bg-red-50 text-red-700";

    case "CANCELLED":
      return "bg-zinc-100 text-zinc-600";

    default:
      return "bg-amber-50 text-amber-700";
  }
}

async function RenterDashboardContent() {
  const renter =
    await requireRenter();

  const [
    statusCounts,
    recentRentals,
  ] = await Promise.all([
    prisma.rental.groupBy({
      by: ["status"],
      where: {
        renterId: renter.id,
      },
      _count: {
        _all: true,
      },
    }),

    prisma.rental.findMany({
      where: {
        renterId: renter.id,
      },
      include: {
        device: {
          select: {
            name: true,
            emoji: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
  ]);

  const countFor = (
    ...statuses: string[]
  ) =>
    statusCounts
      .filter((row) =>
        statuses.includes(
          row.status,
        ),
      )
      .reduce(
        (sum, row) =>
          sum +
          row._count._all,
        0,
      );

  const stats = [
    {
      label: "Active & upcoming",
      description:
        "Approved or active bookings",
      value: countFor(
        "APPROVED",
        "ACTIVE",
      ),
      icon: PackageCheck,
    },
    {
      label: "Pending requests",
      description:
        "Waiting for owner review",
      value: countFor(
        "REQUESTED",
      ),
      icon: Clock3,
    },
    {
      label: "Completed",
      description:
        "Finished rental history",
      value: countFor(
        "RETURNED",
        "COMPLETED",
      ),
      icon: CalendarDays,
    },
  ];

  const firstName =
    renter.name
      .trim()
      .split(/\s+/)[0] ||
    "there";

  return (
    <main className="p-5 md:p-8 lg:p-10">
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold text-amber-600">
              Renter workspace
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
              Welcome back,{" "}
              {firstName}
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Manage your bookings,
              saved devices and rental
              activity.
            </p>
          </div>

          <Link
            href="/devices"
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            <Search className="h-4 w-4" />
            Browse devices
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <section
              key={stat.label}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                  <stat.icon className="h-5 w-5 text-amber-600" />
                </div>

                <p className="text-3xl font-bold tracking-tight text-zinc-950">
                  {stat.value}
                </p>
              </div>

              <p className="mt-5 text-sm font-semibold text-zinc-900">
                {stat.label}
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                {stat.description}
              </p>
            </section>
          ))}
        </div>

        {/* Browse CTA */}
        <section className="mt-6 flex flex-col justify-between gap-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-amber-700">
              Need equipment?
            </p>

            <h2 className="mt-1 text-xl font-bold text-zinc-950">
              Find what you need
              without buying it.
            </h2>

            <p className="mt-1 text-sm text-zinc-600">
              Browse available devices
              from verified GoGoRent
              listings.
            </p>
          </div>

          <Link
            href="/devices"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
          >
            Explore marketplace
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        {/* Rentals */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950">
                Recent bookings
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Your latest rental
                requests and activity.
              </p>
            </div>

            {recentRentals.length >
              0 && (
              <Link
                href="/renter/rentals"
                className="text-sm font-semibold text-amber-600 hover:text-amber-700"
              >
                View all
              </Link>
            )}
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            {recentRentals.length ===
            0 ? (
              <div className="px-6 py-14 text-center">
                <CalendarDays className="mx-auto h-9 w-9 text-zinc-300" />

                <p className="mt-4 font-semibold text-zinc-900">
                  No bookings yet
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Your booking requests
                  will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {recentRentals.map(
                  (rental) => (
                    <Link
                      key={
                        rental.id
                      }
                      href={`/renter/rentals/${rental.id}`}
                      className="flex flex-col gap-4 p-5 transition hover:bg-zinc-50 sm:flex-row sm:items-center"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl">
                        {rental
                          .device
                          .emoji ??
                          "📦"}
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
                          {rental.startDate.toLocaleDateString()}{" "}
                          —{" "}
                          {rental.endDate.toLocaleDateString()}
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(
                          rental.status,
                        )}`}
                      >
                        {rental.status.replaceAll(
                          "_",
                          " ",
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
    </main>
  );
}

export default function RenterDashboard() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-zinc-500">
          Loading dashboard...
        </div>
      }
    >
      <RenterDashboardContent />
    </Suspense>
  );
}