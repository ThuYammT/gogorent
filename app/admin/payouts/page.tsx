import {
  Suspense,
} from "react";

import {
  Banknote,
  Building2,
  CheckCircle2,
  RotateCcw,
  Smartphone,
  TriangleAlert,
} from "lucide-react";

import {
  markDepositRefundPaid,
  markOwnerPayoutPaid,
} from "./actions";

import {
  requireAdmin,
} from "@/lib/admin-auth";

import {
  prisma,
} from "@/lib/prisma";

function payoutMethodName(
  method: string,
) {
  return method ===
    "PROMPTPAY"
    ? "PromptPay"
    : "Bank transfer";
}

async function AdminPayoutContent() {
  await requireAdmin();

  const [
    refunds,
    payouts,
  ] =
    await Promise.all([
      prisma.transaction.findMany({
        where: {
          type:
            "DEPOSIT_REFUND",
        },

        include: {
          rental: {
            include: {
              device: {
                select: {
                  name: true,
                },
              },

              renter: {
                include: {
                  refundProfile:
                    true,
                },
              },
            },
          },
        },

        orderBy: {
          createdAt:
            "desc",
        },
      }),

      prisma.transaction.findMany({
        where: {
          type:
            "OWNER_PAYOUT",
        },

        include: {
          rental: {
            include: {
              device: {
                select: {
                  name: true,
                },
              },

              owner: {
                include: {
                  payoutProfile:
                    true,
                },
              },
            },
          },
        },

        orderBy: {
          createdAt:
            "desc",
        },
      }),
    ]);

  const pendingRefunds =
    refunds.filter(
      (item) =>
        item.status ===
        "PENDING",
    );

  const completedRefunds =
    refunds.filter(
      (item) =>
        item.status ===
        "COMPLETED",
    );

  const pendingPayouts =
    payouts.filter(
      (item) =>
        item.status ===
        "PENDING",
    );

  const completedPayouts =
    payouts.filter(
      (item) =>
        item.status ===
        "COMPLETED",
    );

  return (
    <main className="p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div>
          <p className="text-sm font-medium text-zinc-500">
            Finance
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Settlements
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Process renter deposit refunds and owner payouts after successful returns.
          </p>
        </div>

        {/* RENTER REFUNDS */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Renter deposit refunds
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Return security deposits to renters.
              </p>
            </div>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {pendingRefunds.length} pending
            </span>
          </div>

          {pendingRefunds.length ===
          0 ? (
            <div className="mt-4 rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />

              <p className="mt-3 font-semibold">
                No pending deposit refunds
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {pendingRefunds.map(
                (refund) => {
                  const profile =
                    refund.rental
                      .renter
                      .refundProfile;

                  return (
                    <div
                      key={
                        refund.id
                      }
                      className="rounded-2xl border border-zinc-200 bg-white p-6"
                    >
                      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                              <RotateCcw className="h-5 w-5 text-blue-700" />
                            </div>

                            <div>
                              <p className="font-semibold">
                                {
                                  refund
                                    .rental
                                    .renter
                                    .name
                                }
                              </p>

                              <p className="text-sm text-zinc-500">
                                {
                                  refund
                                    .rental
                                    .device
                                    .name
                                }
                                {" · "}
                                Rental #
                                {refund.rentalId.slice(
                                  -6,
                                )}
                              </p>
                            </div>
                          </div>

                          <p className="mt-5 text-2xl font-semibold">
                            ฿
                            {Number(
                              refund.amount,
                            ).toLocaleString()}
                          </p>

                          {!profile ? (
                            <div className="mt-4 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                              <TriangleAlert className="h-5 w-5 shrink-0" />

                              <div>
                                <p className="font-semibold">
                                  Refund details missing
                                </p>

                                <p className="mt-1">
                                  The renter must configure refund settings before this refund can be processed.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-5 rounded-xl bg-zinc-50 p-4">
                              <div className="flex items-center gap-2">
                                {profile.method ===
                                "PROMPTPAY" ? (
                                  <Smartphone className="h-4 w-4" />
                                ) : (
                                  <Building2 className="h-4 w-4" />
                                )}

                                <p className="font-semibold">
                                  {payoutMethodName(
                                    profile.method,
                                  )}
                                </p>
                              </div>

                              <dl className="mt-3 space-y-2 text-sm">
                                <div className="flex justify-between gap-5">
                                  <dt className="text-zinc-500">
                                    Account name
                                  </dt>

                                  <dd className="font-medium">
                                    {
                                      profile.accountName
                                    }
                                  </dd>
                                </div>

                                {profile.method ===
                                  "BANK_TRANSFER" && (
                                  <>
                                    <div className="flex justify-between gap-5">
                                      <dt className="text-zinc-500">
                                        Bank
                                      </dt>

                                      <dd className="font-medium">
                                        {
                                          profile.bankName
                                        }
                                      </dd>
                                    </div>

                                    <div className="flex justify-between gap-5">
                                      <dt className="text-zinc-500">
                                        Account
                                      </dt>

                                      <dd className="font-medium">
                                        {
                                          profile.accountNumber
                                        }
                                      </dd>
                                    </div>
                                  </>
                                )}

                                {profile.method ===
                                  "PROMPTPAY" && (
                                  <div className="flex justify-between gap-5">
                                    <dt className="text-zinc-500">
                                      PromptPay
                                    </dt>

                                    <dd className="font-medium">
                                      {
                                        profile.promptPayId
                                      }
                                    </dd>
                                  </div>
                                )}
                              </dl>
                            </div>
                          )}
                        </div>

                        {profile && (
                          <form
                            action={markDepositRefundPaid.bind(
                                null,
                                refund.id,
                            )}
                            className="h-fit rounded-xl border border-zinc-200 p-4"
                            >
                            <label className="text-sm font-semibold">
                                Refund transfer reference
                            </label>

                            <input
                                name="transferReference"
                                required
                                placeholder="Bank / PromptPay reference"
                                className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-950"
                            />

                            <div className="mt-4">
                                <label className="text-sm font-semibold">
                                Transfer receipt
                                </label>

                                <p className="mt-1 text-xs text-zinc-500">
                                Upload the bank or PromptPay transfer slip.
                                </p>

                                <input
                                type="file"
                                name="transferReceipt"
                                accept="image/jpeg,image/png,image/webp"
                                required
                                className="mt-2 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-xs file:font-semibold"
                                />
                            </div>

                            <button
                                type="submit"
                                className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                                Mark deposit refunded
                            </button>

                            <p className="mt-2 text-xs leading-5 text-zinc-500">
                                A transfer reference and receipt are required.
                            </p>
                            </form>
                        )}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </section>

        {/* OWNER PAYOUTS */}
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Owner payouts
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Send rental earnings to owners after platform fees.
              </p>
            </div>

            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              {pendingPayouts.length} pending
            </span>
          </div>

          {pendingPayouts.length ===
          0 ? (
            <div className="mt-4 rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />

              <p className="mt-3 font-semibold">
                No pending owner payouts
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {pendingPayouts.map(
                (payout) => {
                  const profile =
                    payout.rental
                      .owner
                      .payoutProfile;

                  return (
                    <div
                      key={
                        payout.id
                      }
                      className="rounded-2xl border border-zinc-200 bg-white p-6"
                    >
                      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                              <Banknote className="h-5 w-5 text-amber-700" />
                            </div>

                            <div>
                              <p className="font-semibold">
                                {
                                  payout
                                    .rental
                                    .owner
                                    .name
                                }
                              </p>

                              <p className="text-sm text-zinc-500">
                                {
                                  payout
                                    .rental
                                    .device
                                    .name
                                }
                                {" · "}
                                Rental #
                                {payout.rentalId.slice(
                                  -6,
                                )}
                              </p>
                            </div>
                          </div>

                          <p className="mt-5 text-2xl font-semibold">
                            ฿
                            {Number(
                              payout.amount,
                            ).toLocaleString()}
                          </p>

                          {!profile ? (
                            <div className="mt-4 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                              <TriangleAlert className="h-5 w-5 shrink-0" />

                              <div>
                                <p className="font-semibold">
                                  Payout details missing
                                </p>

                                <p className="mt-1">
                                  The owner must configure payout settings before payment.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-5 rounded-xl bg-zinc-50 p-4">
                              <div className="flex items-center gap-2">
                                {profile.method ===
                                "PROMPTPAY" ? (
                                  <Smartphone className="h-4 w-4" />
                                ) : (
                                  <Building2 className="h-4 w-4" />
                                )}

                                <p className="font-semibold">
                                  {payoutMethodName(
                                    profile.method,
                                  )}
                                </p>
                              </div>

                              <dl className="mt-3 space-y-2 text-sm">
                                <div className="flex justify-between gap-5">
                                  <dt className="text-zinc-500">
                                    Account name
                                  </dt>

                                  <dd className="font-medium">
                                    {
                                      profile.accountName
                                    }
                                  </dd>
                                </div>

                                {profile.method ===
                                  "BANK_TRANSFER" && (
                                  <>
                                    <div className="flex justify-between gap-5">
                                      <dt className="text-zinc-500">
                                        Bank
                                      </dt>

                                      <dd className="font-medium">
                                        {
                                          profile.bankName
                                        }
                                      </dd>
                                    </div>

                                    <div className="flex justify-between gap-5">
                                      <dt className="text-zinc-500">
                                        Account
                                      </dt>

                                      <dd className="font-medium">
                                        {
                                          profile.accountNumber
                                        }
                                      </dd>
                                    </div>
                                  </>
                                )}

                                {profile.method ===
                                  "PROMPTPAY" && (
                                  <div className="flex justify-between gap-5">
                                    <dt className="text-zinc-500">
                                      PromptPay
                                    </dt>

                                    <dd className="font-medium">
                                      {
                                        profile.promptPayId
                                      }
                                    </dd>
                                  </div>
                                )}
                              </dl>
                            </div>
                          )}
                        </div>

                        {profile && (
                            <form
                            action={markOwnerPayoutPaid.bind(
                                null,
                                payout.id,
                            )}
                            className="h-fit rounded-xl border border-zinc-200 p-4"
                            >
                            <label className="text-sm font-semibold">
                                Payout transfer reference
                            </label>

                            <input
                                name="transferReference"
                                required
                                placeholder="Bank / PromptPay reference"
                                className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-950"
                            />

                            <div className="mt-4">
                                <label className="text-sm font-semibold">
                                Transfer receipt
                                </label>

                                <p className="mt-1 text-xs text-zinc-500">
                                Upload the bank or PromptPay transfer slip.
                                </p>

                                <input
                                type="file"
                                name="transferReceipt"
                                accept="image/jpeg,image/png,image/webp"
                                required
                                className="mt-2 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-xs file:font-semibold"
                                />
                            </div>

                            <button
                                type="submit"
                                className="mt-4 w-full rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                            >
                                Mark owner paid
                            </button>

                            <p className="mt-2 text-xs leading-5 text-zinc-500">
                                A transfer reference and receipt are required.
                            </p>
                            </form>                        )}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </section>

        {/* HISTORY */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold">
            Settlement history
          </h2>

          <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            {completedRefunds.length ===
              0 &&
            completedPayouts.length ===
              0 ? (
              <div className="p-8 text-center text-sm text-zinc-500">
                No completed settlements yet.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {completedRefunds.map(
                  (refund) => (
                    <div
                      key={
                        refund.id
                      }
                      className="flex items-center justify-between gap-5 p-5"
                    >
                      <div>
                        <p className="font-semibold">
                          Deposit refund
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                          {
                            refund
                              .rental
                              .renter
                              .name
                          }
                          {" · "}
                          Rental #
                          {refund.rentalId.slice(
                            -6,
                          )}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold">
                          ฿
                          {Number(
                            refund.amount,
                          ).toLocaleString()}
                        </p>

                        <p className="text-xs font-semibold text-emerald-600">
                          COMPLETED
                        </p>
                      </div>
                    </div>
                  ),
                )}

                {completedPayouts.map(
                  (payout) => (
                    <div
                      key={
                        payout.id
                      }
                      className="flex items-center justify-between gap-5 p-5"
                    >
                      <div>
                        <p className="font-semibold">
                          Owner payout
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                          {
                            payout
                              .rental
                              .owner
                              .name
                          }
                          {" · "}
                          Rental #
                          {payout.rentalId.slice(
                            -6,
                          )}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold">
                          ฿
                          {Number(
                            payout.amount,
                          ).toLocaleString()}
                        </p>

                        <p className="text-xs font-semibold text-emerald-600">
                          COMPLETED
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function AdminPayoutPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-zinc-500">
          Loading settlements...
        </div>
      }
    >
      <AdminPayoutContent />
    </Suspense>
  );
}