import { Suspense } from "react";
import {
  CalendarDays,
  Check,
  Clock3,
  Inbox,
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
  const owner = await requireOwner();

  const requests = await prisma.rental.findMany({
    where: {
      ownerId: owner.id,
      status: "REQUESTED",
    },

    include: {
      device: true,
      renter: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <>
      <header className="border-b border-zinc-200 bg-white px-6 py-8 md:px-10 xl:px-12">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-sm font-medium text-zinc-500">
            Rental management
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
            Rental requests
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Review incoming requests for your devices.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-6 py-8 md:px-10 xl:px-12">
        {requests.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center">
            <Inbox className="mx-auto h-9 w-9 text-zinc-300" />

            <h2 className="mt-4 font-semibold text-zinc-800">
              No pending requests
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              New rental requests will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((rental) => {
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

              return (
                <article
                  key={rental.id}
                  className="rounded-2xl border border-zinc-200 bg-white"
                >
                  <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-2xl">
                      {rental.device.emoji ?? "📦"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="font-semibold text-zinc-950">
                          {rental.device.name}
                        </h2>

                        <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                          Pending
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-500">
                        <span className="flex items-center gap-2">
                          <UserRound className="h-4 w-4" />
                          {rental.renter.name}
                        </span>

                        <span className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          {rental.startDate.toLocaleDateString()}
                          {" – "}
                          {rental.endDate.toLocaleDateString()}
                        </span>

                        <span className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4" />
                          {rental.totalDays} days
                        </span>
                      </div>

                      {rental.renterNote && (
                        <div className="mt-4 rounded-lg bg-zinc-50 px-4 py-3">
                          <p className="text-xs font-medium text-zinc-500">
                            Renter note
                          </p>

                          <p className="mt-1 text-sm text-zinc-700">
                            {rental.renterNote}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="min-w-[190px]">
                      <p className="text-xs text-zinc-500">
                        Rental amount
                      </p>

                      <p className="mt-1 text-xl font-semibold">
                        ฿
                        {Number(
                          rental.rentalAmount,
                        ).toLocaleString()}
                      </p>

                      <p className="mt-1 text-xs text-zinc-400">
                        + ฿
                        {Number(
                          rental.depositAmount,
                        ).toLocaleString()}{" "}
                        deposit
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-zinc-100 bg-zinc-50/60 px-6 py-4 md:flex-row md:items-center md:justify-end">
                    <form
                      action={rejectAction}
                      className="flex flex-1 gap-2 md:max-w-md"
                    >
                      <input
                        name="reason"
                        placeholder="Optional rejection reason"
                        className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                      />

                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </button>
                    </form>

                    <form action={approveAction}>
                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                      >
                        <Check className="h-4 w-4" />
                        Approve request
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function Loading() {
  return (
    <div className="p-10">
      <div className="h-40 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

export default function OwnerRequestsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <RequestsContent />
    </Suspense>
  );
}