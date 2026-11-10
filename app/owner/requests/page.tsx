import { Suspense } from "react";

import {
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  MessageSquareText,
  UserRound,
  X,
} from "lucide-react";

import {
  approveRentalRequest,
  rejectRentalRequest,
} from "./actions";

import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";

async function RequestsContent() {
  const owner =
    await requireOwner();

  const requests =
    await prisma.rental.findMany({
      where: {
        ownerId:
          owner.id,

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
    });

  return (
    <>
      {/* HEADER */}
      <header className="border-b border-zinc-200 bg-white px-6 py-8 md:px-10 xl:px-12">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-sm font-medium text-zinc-500">
            Rental management
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
              Rental Requests
            </h1>

            {requests.length >
              0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                {
                  requests.length
                }{" "}
                pending
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-zinc-500">
            Review requests from renters who want to borrow your devices.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-6 py-8 md:px-10 xl:px-12">
        {requests.length ===
        0 ? (
          <section className="rounded-2xl border border-zinc-200 bg-white px-6 py-20 text-center">
            <Clock3 className="mx-auto h-9 w-9 text-zinc-300" />

            <h2 className="mt-4 font-semibold text-zinc-900">
              No pending requests
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              New rental requests will appear here when renters request your devices.
            </p>
          </section>
        ) : (
          <div className="space-y-5">
            {requests.map(
              (rental) => {
                const approveAction =
                  approveRentalRequest.bind(
                    null,
                    rental.id,
                  );

                const rejectAction =
                  rejectRentalRequest.bind(
                    null,
                    rental.id,
                  );

                const image =
                  rental.device
                    .images[0];

                return (
                  <section
                    key={
                      rental.id
                    }
                    className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"
                  >
                    <div className="grid gap-0 lg:grid-cols-[230px_1fr_300px]">
                      {/* DEVICE IMAGE */}
                      <div className="min-h-[220px] bg-zinc-100">
                        {image ? (
                          <img
                            src={
                              image.url
                            }
                            alt={
                              rental
                                .device
                                .name
                            }
                            className="h-full min-h-[220px] w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full min-h-[220px] items-center justify-center text-6xl">
                            {rental
                              .device
                              .emoji ??
                              "📦"}
                          </div>
                        )}
                      </div>

                      {/* DETAILS */}
                      <div className="p-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                              Rental request
                            </p>

                            <h2 className="mt-1 text-xl font-semibold text-zinc-950">
                              {
                                rental
                                  .device
                                  .name
                              }
                            </h2>
                          </div>

                          <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            Pending review
                          </span>
                        </div>

                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                          <div className="flex gap-3">
                            <UserRound className="mt-0.5 h-4 w-4 text-zinc-400" />

                            <div>
                              <p className="text-xs text-zinc-500">
                                Renter
                              </p>

                              <p className="mt-1 text-sm font-semibold text-zinc-900">
                                {
                                  rental
                                    .renter
                                    .name
                                }
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <CalendarDays className="mt-0.5 h-4 w-4 text-zinc-400" />

                            <div>
                              <p className="text-xs text-zinc-500">
                                Rental dates
                              </p>

                              <p className="mt-1 text-sm font-semibold text-zinc-900">
                                {rental.startDate.toLocaleDateString()}
                                {" "}–{" "}
                                {rental.endDate.toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <Clock3 className="mt-0.5 h-4 w-4 text-zinc-400" />

                            <div>
                              <p className="text-xs text-zinc-500">
                                Duration
                              </p>

                              <p className="mt-1 text-sm font-semibold text-zinc-900">
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

                          <div className="flex gap-3">
                            <MapPin className="mt-0.5 h-4 w-4 text-zinc-400" />

                            <div>
                              <p className="text-xs text-zinc-500">
                                Device location
                              </p>

                              <p className="mt-1 text-sm font-semibold text-zinc-900">
                                {rental
                                  .device
                                  .location ??
                                  "Not specified"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {rental.renterNote && (
                          <div className="mt-6 flex gap-3 rounded-xl bg-zinc-50 p-4">
                            <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />

                            <div>
                              <p className="text-xs font-medium text-zinc-500">
                                Renter note
                              </p>

                              <p className="mt-1 text-sm leading-6 text-zinc-700">
                                {
                                  rental.renterNote
                                }
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* MONEY + ACTIONS */}
                      <div className="border-t border-zinc-100 bg-zinc-50/60 p-6 lg:border-l lg:border-t-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                          Request total
                        </p>

                        <p className="mt-2 text-3xl font-semibold text-zinc-950">
                          ฿
                          {Number(
                            rental.rentalAmount,
                          ).toLocaleString()}
                        </p>

                        <div className="mt-4 space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-zinc-500">
                              Rental
                            </span>

                            <span className="font-medium">
                              ฿
                              {Number(
                                rental.rentalAmount,
                              ).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-zinc-500">
                              Deposit
                            </span>

                            <span className="font-medium">
                              ฿
                              {Number(
                                rental.depositAmount,
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="mt-6 space-y-3">
                          <form
                            action={
                              approveAction
                            }
                          >
                            <button
                              type="submit"
                              className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                            >
                              <Check className="h-4 w-4" />
                              Approve request
                            </button>
                          </form>

                          <form
                            action={
                              rejectAction
                            }
                          >
                            <input
                              name="reason"
                              placeholder="Optional rejection reason"
                              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                            />

                            <button
                              type="submit"
                              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                              Reject request
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </section>
                );
              },
            )}
          </div>
        )}
      </div>
    </>
  );
}

function RequestsLoading() {
  return (
    <div className="p-8 md:p-10">
      <div className="space-y-5">
        {[1, 2, 3].map(
          (item) => (
            <div
              key={item}
              className="h-64 animate-pulse rounded-2xl bg-white"
            />
          ),
        )}
      </div>
    </div>
  );
}

export default function OwnerRequestsPage() {
  return (
    <Suspense
      fallback={
        <RequestsLoading />
      }
    >
      <RequestsContent />
    </Suspense>
  );
}