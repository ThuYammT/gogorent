import Link from "next/link";
import Image from "next/image";

import {
  notFound,
  redirect,
} from "next/navigation";

import {
  Suspense,
} from "react";

import {
  ArrowLeft,
  Banknote,
  ShieldCheck,
} from "lucide-react";

import PromptPayCheckout from "@/components/renter/PromptPayCheckout";

import {
  prisma,
} from "@/lib/prisma";

import {
  requireRenter,
} from "@/lib/session";

async function PaymentContent({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const renter =
    await requireRenter();

  const testMode = process.env.OMISE_SECRET_KEY?.startsWith("skey_test_") ?? false;

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
            images: {
              orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
              take: 1,
              select: { url: true },
            },
          },
        },

        collectionIssues: {
          where: {
            status: {
              in: [
                "OPEN",
                "PROPOSED",
              ],
            },
          },

          select: {
            id: true,
          },
        },

        transactions: {
          where: {
            type: {
              in: [
                "RENTAL_PAYMENT",
                "DEPOSIT_HOLD",
              ],
            },
          },

          orderBy: {
            createdAt:
              "desc",
          },
        },
      },
    });

  if (!rental) {
    notFound();
  }

  if (
    rental.status ===
    "REQUESTED"
  ) {
    redirect(
      `/renter/rentals/${rental.id}`,
    );
  }

  const paid =
    rental.transactions.some(
      (item) =>
        item.type ===
          "RENTAL_PAYMENT" &&
        item.status ===
          "COMPLETED",
    ) &&
    rental.transactions.some(
      (item) =>
        item.type ===
          "DEPOSIT_HOLD" &&
        item.status ===
          "COMPLETED",
    );

  return (
    <main className="p-5 md:p-8 lg:p-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/renter/rentals/${rental.id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to booking
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:p-7">
            <div className="flex items-center gap-4">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-amber-50 text-3xl">
                {rental.device.images[0]?.url ? (
                  <Image
                    src={rental.device.images[0].url}
                    alt={rental.device.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (rental.device.emoji ?? "📦")}
              </div>

              <div>
                <p className="text-sm text-zinc-500">
                  GoGoRent checkout
                </p>

                <h1 className="mt-1 text-2xl font-bold text-zinc-950">
                  {
                    rental
                      .device
                      .name
                  }
                </h1>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-zinc-50 p-5">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-zinc-500">
                  Rental fee
                </span>

                <span className="font-semibold text-zinc-950">
                  ฿
                  {Number(
                    rental.rentalAmount,
                  ).toLocaleString()}
                </span>
              </div>

              <div className="mt-3 flex justify-between gap-4 text-sm">
                <span className="text-zinc-500">
                  Security deposit
                </span>

                <span className="font-semibold text-zinc-950">
                  ฿
                  {Number(
                    rental.depositAmount,
                  ).toLocaleString()}
                </span>
              </div>

              <div className="mt-4 border-t border-zinc-200 pt-4">
                <div className="flex justify-between gap-4">
                  <span className="font-semibold text-zinc-950">
                    Total
                  </span>

                  <span className="text-xl font-bold text-zinc-950">
                    ฿
                    {Number(
                      rental.totalAmount,
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-4 flex items-center gap-2">
                <Banknote className="h-5 w-5 text-[#0d6efd]" />

                <div>
                  <p className="font-semibold text-zinc-950">
                    PromptPay
                  </p>

                  <p className="text-sm text-zinc-500">
                    {testMode ? "Omise test mode — simulated payment for demonstration." : "Pay using your Thai mobile banking app."}
                  </p>
                </div>
              </div>

              {paid ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                  Payment already completed. You can continue to collection.
                </div>
              ) : rental.status !==
                "APPROVED" ? (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                  This booking is not currently eligible for payment.
                </div>
              ) : rental
                  .collectionIssues
                  .length >
                0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Collection is paused for a device issue. Resolve the issue before creating another payment QR.
                </div>
              ) : (
                <PromptPayCheckout
                  testMode={testMode}
                  rentalId={
                    rental.id
                  }
                />
              )}
            </div>
          </section>

          <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
              </div>

              <div>
                <p className="text-sm font-semibold text-zinc-950">
                  Payment protection
                </p>

                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  Your payment must be confirmed before the owner can generate the collection QR.
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-zinc-100 pt-5 text-xs leading-5 text-zinc-400">
              PromptPay payment confirmation is verified directly against Omise before GoGoRent marks the booking as paid.
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function PaymentPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-zinc-500">
          Loading checkout...
        </div>
      }
    >
      <PaymentContent
        params={
          params
        }
      />
    </Suspense>
  );
}
