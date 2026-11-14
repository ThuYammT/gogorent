import Link from "next/link";
import { Suspense } from "react";

import { Bell, CalendarDays, X } from "lucide-react";

import { cancelRenterBooking } from "./actions";

import { prisma } from "@/lib/prisma";
import { requireRenter } from "@/lib/session";

function statusStyle(status: string) {
  switch (status) {
    case "APPROVED":
      return "bg-indigo-50 text-indigo-700";
    case "ACTIVE":
      return "bg-blue-50 text-blue-700";
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";
    case "REJECTED":
      return "bg-red-50 text-red-700";
    case "CANCELLED":
      return "bg-zinc-100 text-zinc-600";
    default:
      return "bg-amber-50 text-amber-700";
  }
}

async function RenterRentalsContent({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const renter = await requireRenter();
  const params = await searchParams;

  const [rentals, newRequest] = await Promise.all([
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
    }),
    params.created
      ? prisma.rental.findFirst({
          where: {
            id: params.created,
            renterId: renter.id,
          },
          select: {
            id: true,
          },
        })
      : Promise.resolve(null),
  ]);

  return (
    <main className="min-h-screen bg-[#fafafa] p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-orange-500">RENTER WORKSPACE</p>
            <h1 className="mt-1 text-3xl font-black text-zinc-950">Your bookings</h1>
          </div>
          <Link
            href="/renter/notifications"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700"
          >
            <Bell className="h-4 w-4" />
            Notifications
          </Link>
        </div>

        {newRequest && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            Your booking request was sent to the owner.
          </div>
        )}

        {rentals.length === 0 ? (
          <section className="mt-6 rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center">
            <CalendarDays className="mx-auto h-9 w-9 text-zinc-300" />
            <h2 className="mt-4 font-semibold text-zinc-900">No bookings yet</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Your rental requests and bookings will appear here.
            </p>
            <Link
              href="/devices"
              className="mt-5 inline-flex rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Browse devices
            </Link>
          </section>
        ) : (
          <section className="mt-6 divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            {rentals.map((rental) => (
              <article
                key={rental.id}
                id={rental.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-2xl">
                  {rental.device.emoji ?? "📦"}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-zinc-900">
                    {rental.device.name}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    {rental.startDate.toLocaleDateString()} –{" "}
                    {rental.endDate.toLocaleDateString()} · {rental.totalDays}{" "}
                    {rental.totalDays === 1 ? "day" : "days"}
                  </p>
                </div>
                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(
                    rental.status,
                  )}`}
                >
                  {rental.status.replaceAll("_", " ")}
                </span>
                {["REQUESTED", "APPROVED"].includes(rental.status) && (
                  <form action={cancelRenterBooking.bind(null, rental.id)}>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                    >
                      <X className="h-4 w-4" />
                      Cancel booking
                    </button>
                  </form>
                )}
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

export default function RenterRentalsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  return (
    <Suspense
      fallback={<div className="p-6 text-sm text-zinc-500">Loading bookings...</div>}
    >
      <RenterRentalsContent searchParams={searchParams} />
    </Suspense>
  );
}