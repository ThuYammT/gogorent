import Link from "next/link";
import { Suspense } from "react";

import {
  Bell,
  CalendarDays,
  ChevronRight,
  X,
} from "lucide-react";

import {
  cancelRenterBooking,
} from "./actions";

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

async function RenterRentalsContent({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
  }>;
}) {
  const renter =
    await requireRenter();

  const params =
    await searchParams;

  const [
    rentals,
    newRequest,
  ] = await Promise.all([
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
            renterId:
              renter.id,
          },
          select: {
            id: true,
          },
        })
      : Promise.resolve(null),
  ]);

  return (
    <main className="p-5 md:p-8 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-amber-600">
              Rental management
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
              My bookings
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Track requests, approved
              rentals and your rental
              history.
            </p>
          </div>

          <Link
            href="/renter/notifications"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
          >
            <Bell className="h-4 w-4" />
            Notifications
          </Link>
        </div>

        {newRequest && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            Your booking request was
            sent successfully. The owner
            will review it next.
          </div>
        )}

        {rentals.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100">
              <CalendarDays className="h-6 w-6 text-zinc-400" />
            </div>

            <h2 className="mt-4 font-semibold text-zinc-900">
              No bookings yet
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Your rental requests will
              appear here.
            </p>

            <Link
              href="/devices"
              className="mt-6 inline-flex rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Browse devices
            </Link>
          </section>
        ) : (
          <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            {/* Desktop headings */}
            <div className="hidden grid-cols-[minmax(0,1.5fr)_1fr_120px_210px] gap-6 border-b border-zinc-100 bg-zinc-50/70 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 md:grid">
              <div>Device</div>
              <div>Rental period</div>
              <div>Status</div>
              <div className="text-right">
                Actions
              </div>
            </div>

            <div className="divide-y divide-zinc-100">
              {rentals.map(
                (rental) => (
                  <article
                    key={
                      rental.id
                    }
                    id={
                      rental.id
                    }
                    className="grid gap-4 p-5 md:grid-cols-[minmax(0,1.5fr)_1fr_120px_210px] md:items-center md:gap-6"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl">
                        {rental
                          .device
                          .emoji ??
                          "📦"}
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

                    <div>
                      <p className="text-sm font-medium text-zinc-700">
                        {rental.startDate.toLocaleDateString()}{" "}
                        –{" "}
                        {rental.endDate.toLocaleDateString()}
                      </p>

                      <p className="mt-1 text-xs text-zinc-400">
                        {
                          rental.totalDays
                        }{" "}
                        {rental.totalDays ===
                        1
                          ? "day"
                          : "days"}
                      </p>
                    </div>

                    <div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(
                          rental.status,
                        )}`}
                      >
                        {rental.status.replaceAll(
                          "_",
                          " ",
                        )}
                      </span>
                    </div>

                    <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                      <Link
                        href={`/renter/rentals/${rental.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                      >
                        {rental.status ===
                        "APPROVED"
                          ? "View / scan QR"
                          : "View"}

                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>

                      {[
                        "REQUESTED",
                        "APPROVED",
                      ].includes(
                        rental.status,
                      ) && (
                        <form
                          action={cancelRenterBooking.bind(
                            null,
                            rental.id,
                          )}
                        >
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancel
                          </button>
                        </form>
                      )}
                    </div>
                  </article>
                ),
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default function RenterRentalsPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
  }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-zinc-500">
          Loading bookings...
        </div>
      }
    >
      <RenterRentalsContent
        searchParams={
          searchParams
        }
      />
    </Suspense>
  );
}