import { Suspense } from "react";
import {
  CalendarDays,
  Package,
  UserRound,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";

function statusStyle(status: string) {
  switch (status) {
    case "APPROVED":
      return "bg-blue-50 text-blue-700";

    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700";

    case "RETURNED":
      return "bg-violet-50 text-violet-700";

    case "COMPLETED":
      return "bg-zinc-100 text-zinc-700";

    case "REJECTED":
      return "bg-red-50 text-red-700";

    case "CANCELLED":
      return "bg-zinc-100 text-zinc-500";

    case "DISPUTED":
      return "bg-orange-50 text-orange-700";

    default:
      return "bg-zinc-100 text-zinc-600";
  }
}

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) => letter.toUpperCase(),
    );
}

async function RentalsContent() {
  const owner = await requireOwner();

  const rentals = await prisma.rental.findMany({
    where: {
      ownerId: owner.id,

      status: {
        not: "REQUESTED",
      },
    },

    include: {
      device: true,
      renter: true,
    },

    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <>
      <header className="border-b border-zinc-200 bg-white px-6 py-8 md:px-10 xl:px-12">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-sm font-medium text-zinc-500">
            Rental management
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Rentals
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Track approved, active and completed rentals.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-6 py-8 md:px-10 xl:px-12">
        {rentals.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white py-16 text-center">
            <Package className="mx-auto h-9 w-9 text-zinc-300" />

            <p className="mt-4 font-medium text-zinc-700">
              No rental history yet
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <div className="hidden grid-cols-[1.5fr_1fr_1.2fr_.8fr_.8fr] border-b border-zinc-200 bg-zinc-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 md:grid">
              <span>Device</span>
              <span>Renter</span>
              <span>Rental period</span>
              <span>Amount</span>
              <span>Status</span>
            </div>

            <div className="divide-y divide-zinc-100">
              {rentals.map((rental) => (
                <div
                  key={rental.id}
                  className="grid gap-4 px-6 py-5 md:grid-cols-[1.5fr_1fr_1.2fr_.8fr_.8fr] md:items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-lg">
                      {rental.device.emoji ?? "📦"}
                    </div>

                    <p className="font-medium">
                      {rental.device.name}
                    </p>
                  </div>

                  <span className="flex items-center gap-2 text-sm text-zinc-600">
                    <UserRound className="h-4 w-4" />
                    {rental.renter.name}
                  </span>

                  <span className="flex items-center gap-2 text-sm text-zinc-600">
                    <CalendarDays className="h-4 w-4" />
                    {rental.startDate.toLocaleDateString()}
                    {" – "}
                    {rental.endDate.toLocaleDateString()}
                  </span>

                  <span className="text-sm font-semibold">
                    ฿
                    {Number(
                      rental.rentalAmount,
                    ).toLocaleString()}
                  </span>

                  <div>
                    <span
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold ${statusStyle(
                        rental.status,
                      )}`}
                    >
                      {formatStatus(
                        rental.status,
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function OwnerRentalsPage() {
  return (
    <Suspense fallback={<div className="p-10">Loading...</div>}>
      <RentalsContent />
    </Suspense>
  );
}