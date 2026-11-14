import Link from "next/link";
import {
  notFound,
} from "next/navigation";
import { Suspense } from "react";

import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Receipt,
  ShieldCheck,
} from "lucide-react";

import {
  cancelRenterBooking,
} from "../actions";

import CollectionQrScanner from "@/components/renter/CollectionQrScanner";
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

async function RenterBookingContent({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const renter =
    await requireRenter();

  const { id } =
    await params;

  const rental =
    await prisma.rental.findFirst({
      where: {
        id,
        renterId:
          renter.id,
      },
      include: {
        device: {
          select: {
            name: true,
            emoji: true,
            location: true,
          },
        },

        handovers: {
          where: {
            type: "COLLECTION",
          },
          select: {
            status: true,
          },
        },
      },
    });

  if (!rental) {
    notFound();
  }

  return (
    <main className="p-5 md:p-8 lg:p-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/renter/rentals"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to bookings
        </Link>

        <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          {/* Header */}
          <div className="flex flex-col justify-between gap-5 border-b border-zinc-100 p-6 md:flex-row md:items-start md:p-7">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-3xl">
                {rental.device
                  .emoji ??
                  "📦"}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Booking #
                  {rental.id.slice(
                    -6,
                  )}
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950">
                  {
                    rental.device
                      .name
                  }
                </h1>
              </div>
            </div>

            <span
              className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyle(
                rental.status,
              )}`}
            >
              {rental.status.replaceAll(
                "_",
                " ",
              )}
            </span>
          </div>

          {/* Details */}
          <div className="grid gap-6 p-6 md:grid-cols-2 md:p-7">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                <CalendarDays className="h-4 w-4 text-zinc-600" />
              </div>

              <div>
                <p className="text-xs font-medium text-zinc-500">
                  Rental period
                </p>

                <p className="mt-1 text-sm font-semibold text-zinc-900">
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
            </div>

            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                <MapPin className="h-4 w-4 text-zinc-600" />
              </div>

              <div>
                <p className="text-xs font-medium text-zinc-500">
                  Device location
                </p>

                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  {rental.device
                    .location ??
                    "Not specified"}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                <Receipt className="h-4 w-4 text-zinc-600" />
              </div>

              <div>
                <p className="text-xs font-medium text-zinc-500">
                  Rental amount
                </p>

                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  ฿
                  {Number(
                    rental.rentalAmount,
                  ).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                <ShieldCheck className="h-4 w-4 text-zinc-600" />
              </div>

              <div>
                <p className="text-xs font-medium text-zinc-500">
                  Security deposit
                </p>

                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  ฿
                  {Number(
                    rental.depositAmount,
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {rental.rejectReason && (
            <div className="mx-6 mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 md:mx-7">
              <p className="font-semibold">
                Booking rejected
              </p>

              <p className="mt-1">
                {
                  rental.rejectReason
                }
              </p>
            </div>
          )}

          {rental.renterNote && (
            <div className="border-t border-zinc-100 px-6 py-5 md:px-7">
              <p className="text-sm font-semibold text-zinc-900">
                Your note
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-600">
                {
                  rental.renterNote
                }
              </p>
            </div>
          )}

          {/* QR */}
          {rental.status ===
            "APPROVED" && (
            <div className="border-t border-zinc-100 px-6 py-6 md:px-7">
              

              {rental.handovers.some(
                (handover) =>
                  handover.status !==
                  "INITIATED",
              ) ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
                  Collection QR has
                  already been scanned.
                </div>
              ) : (
                <CollectionQrScanner
                  rentalId={
                    rental.id
                  }
                />
              )}
            </div>
          )}

          {/* Cancel */}
          {[
            "REQUESTED",
            "APPROVED",
          ].includes(
            rental.status,
          ) && (
            <div className="border-t border-zinc-100 px-6 py-5 md:px-7">
              <form
                action={cancelRenterBooking.bind(
                  null,
                  rental.id,
                )}
              >
                <button
                  type="submit"
                  className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Cancel booking
                </button>
              </form>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function RenterBookingPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-zinc-500">
          Loading booking...
        </div>
      }
    >
      <RenterBookingContent
        params={params}
      />
    </Suspense>
  );
}