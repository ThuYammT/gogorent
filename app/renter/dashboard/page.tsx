import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  PackageCheck,
  Search,
  Sparkles,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireRenter } from "@/lib/session";

function statusStyle(status: string) {
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
      return "bg-yellow-100 text-orange-600";
  }
}

async function RenterDashboardContent() {
  const renter = await requireRenter();

  const [statusCounts, recentRentals] = await Promise.all([
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

  const countFor = (...statuses: string[]) =>
    statusCounts
      .filter((row) => statuses.includes(row.status))
      .reduce((sum, row) => sum + row._count._all, 0);

  const stats = [
    {
      label: "Active & upcoming",
      value: countFor("APPROVED", "ACTIVE"),
      icon: PackageCheck,
    },
    {
      label: "Pending requests",
      value: countFor("REQUESTED"),
      icon: Clock3,
    },
    {
      label: "Completed",
      value: countFor("RETURNED", "COMPLETED"),
      icon: CalendarDays,
    },
  ];

  const firstName = renter.name.trim().split(/\s+/)[0] || "there";

  return (
    <main className="min-h-screen bg-[#fafafa] p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="font-bold text-orange-500">RENTER DASHBOARD</p>

            <h1 className="mt-1 text-4xl font-black">Hey {firstName} 👋</h1>

            <p className="mt-2 text-zinc-500">
              Ready to find something useful today?
            </p>
          </div>

          <Link
            href="/devices"
            className="flex w-fit items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 font-bold text-white"
          >
            <Search className="h-5 w-5" />
            Browse devices
          </Link>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[28px] bg-white p-6 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100">
                <stat.icon className="text-orange-500" />
              </div>

              <p className="mt-7 text-3xl font-black">{stat.value}</p>

              <p className="text-sm text-zinc-400">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-[32px] bg-gradient-to-r from-yellow-300 to-orange-400 p-8 md:flex md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 font-bold text-orange-900">
              <Sparkles />
              Need something for your next project?
            </div>

            <h2 className="mt-3 text-3xl font-black text-zinc-900">
              Don&apos;t buy it. GoGo it.
            </h2>
          </div>

          <Link
            href="/devices"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-bold md:mt-0"
          >
            Explore
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <section className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black">Your rentals</h2>
            {recentRentals.length > 0 && (
              <Link
                href="/renter/rentals"
                className="text-sm font-bold text-orange-500 hover:text-orange-600"
              >
                View all
              </Link>
            )}
          </div>

          {recentRentals.length === 0 ? (
            <div className="mt-5 rounded-[28px] bg-white px-6 py-14 text-center">
              <CalendarDays className="mx-auto h-9 w-9 text-zinc-300" />
              <p className="mt-4 font-black">No rentals yet</p>
              <p className="mt-1 text-sm text-zinc-400">
                Your booking requests will show up here.
              </p>
            </div>
          ) : (
            <div className="mt-5 overflow-hidden rounded-[28px] bg-white">
              {recentRentals.map((rental) => (
                <Link
                  key={rental.id}
                  href={`/renter/rentals/${rental.id}`}
                  className="flex items-center gap-5 border-b border-zinc-100 p-6 last:border-none hover:bg-zinc-50"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-yellow-50 text-3xl">
                    {rental.device.emoji ?? "📦"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black">{rental.device.name}</p>

                    <p className="text-sm text-zinc-400">
                      {rental.startDate.toLocaleDateString()} —{" "}
                      {rental.endDate.toLocaleDateString()}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-4 py-2 text-xs font-bold ${statusStyle(
                      rental.status,
                    )}`}
                  >
                    {rental.status.replaceAll("_", " ")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function RenterDashboard() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-zinc-500">Loading dashboard...</div>
      }
    >
      <RenterDashboardContent />
    </Suspense>
  );
}
