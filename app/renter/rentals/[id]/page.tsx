import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ArrowLeft, CalendarDays } from "lucide-react";

import { cancelRenterBooking } from "../actions";

import { prisma } from "@/lib/prisma";
import { requireRenter } from "@/lib/session";

async function RenterBookingContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const renter = await requireRenter();
  const { id } = await params;
  const rental = await prisma.rental.findFirst({
    where: {
      id,
      renterId: renter.id,
    },
    include: {
      device: {
        select: {
          name: true,
          emoji: true,
          location: true,
        },
      },
    },
  });

  if (!rental) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-65px)] max-w-4xl px-6 py-10">
      <Link
        href="/renter/rentals"
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-950"
      >
        <ArrowLeft className="h-4 w-4" />
        All bookings
      </Link>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-50 text-3xl">
              {rental.device.emoji ?? "📦"}
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Booking #{rental.id.slice(-6)}
              </p>
              <h1 className="mt-1 text-2xl font-bold text-zinc-950">
                {rental.device.name}
              </h1>
            </div>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700">
            {rental.status.replaceAll("_", " ")}
          </span>
        </div>

        <div className="mt-8 grid gap-5 border-t border-zinc-100 pt-6 sm:grid-cols-2">
          <div>
            <p className="text-sm text-zinc-500">Rental period</p>
            <p className="mt-2 flex items-center gap-2 font-semibold text-zinc-900">
              <CalendarDays className="h-4 w-4 text-orange-500" />
              {rental.startDate.toLocaleDateString()} –{" "}
              {rental.endDate.toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Device location</p>
            <p className="mt-2 font-semibold text-zinc-900">
              {rental.device.location ?? "Not specified"}
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Rental amount</p>
            <p className="mt-2 font-semibold text-zinc-900">
              ฿{Number(rental.rentalAmount).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Security deposit</p>
            <p className="mt-2 font-semibold text-zinc-900">
              ฿{Number(rental.depositAmount).toLocaleString()}
            </p>
          </div>
        </div>

        {rental.rejectReason && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {rental.rejectReason}
          </div>
        )}

        {rental.renterNote && (
          <div className="mt-6">
            <p className="text-sm font-semibold text-zinc-800">Your note</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600">
              {rental.renterNote}
            </p>
          </div>
        )}

        {["REQUESTED", "APPROVED"].includes(rental.status) && (
          <form
            action={cancelRenterBooking.bind(null, rental.id)}
            className="mt-8 border-t border-zinc-100 pt-6"
          >
            <button
              type="submit"
              className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
            >
              Cancel booking
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export default function RenterBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={<div className="p-6 text-sm text-zinc-500">Loading booking...</div>}
    >
      <RenterBookingContent params={params} />
    </Suspense>
  );
}