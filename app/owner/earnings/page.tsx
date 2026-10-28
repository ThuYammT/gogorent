import { Suspense } from "react";
import {
  Banknote,
  CircleDollarSign,
  Clock3,
  WalletCards,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";

async function EarningsContent() {
  const owner = await requireOwner();

  const transactions =
    await prisma.transaction.findMany({
      where: {
        rental: {
          ownerId: owner.id,
        },

        type: "OWNER_PAYOUT",
      },

      include: {
        rental: {
          include: {
            device: true,
            renter: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

  const total = transactions
    .filter(
      (tx) =>
        tx.status === "COMPLETED",
    )
    .reduce(
      (sum, tx) =>
        sum + Number(tx.amount),
      0,
    );

  const pending = transactions
    .filter(
      (tx) =>
        tx.status === "PENDING",
    )
    .reduce(
      (sum, tx) =>
        sum + Number(tx.amount),
      0,
    );

  const completedCount =
    transactions.filter(
      (tx) =>
        tx.status === "COMPLETED",
    ).length;

  const stats = [
    {
      label: "Total earnings",
      value: `฿${total.toLocaleString()}`,
      icon: CircleDollarSign,
    },

    {
      label: "Pending payout",
      value: `฿${pending.toLocaleString()}`,
      icon: Clock3,
    },

    {
      label: "Completed payouts",
      value:
        completedCount.toString(),
      icon: Banknote,
    },
  ];

  return (
    <>
      <header className="border-b border-zinc-200 bg-white px-6 py-8 md:px-10 xl:px-12">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-sm font-medium text-zinc-500">
            Financial overview
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Earnings
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Track earnings generated from your rentals.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-6 py-8 md:px-10 xl:px-12">
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-zinc-200 bg-white p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
                  <Icon className="h-5 w-5" />
                </div>

                <p className="mt-5 text-sm text-zinc-500">
                  {stat.label}
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>

        <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 px-6 py-5">
            <h2 className="font-semibold">
              Payout history
            </h2>
          </div>

          {transactions.length === 0 ? (
            <div className="py-16 text-center">
              <WalletCards className="mx-auto h-9 w-9 text-zinc-300" />

              <p className="mt-4 text-sm text-zinc-500">
                No payouts recorded yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex flex-col justify-between gap-4 px-6 py-5 md:flex-row md:items-center"
                >
                  <div>
                    <p className="font-medium">
                      {tx.rental.device.name}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Rented by{" "}
                      {tx.rental.renter.name}
                    </p>
                  </div>

                  <div className="md:text-right">
                    <p className="font-semibold">
                      ฿
                      {Number(
                        tx.amount,
                      ).toLocaleString()}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {tx.createdAt.toLocaleDateString()}
                      {" · "}
                      {tx.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default function OwnerEarningsPage() {
  return (
    <Suspense fallback={<div className="p-10">Loading...</div>}>
      <EarningsContent />
    </Suspense>
  );
}