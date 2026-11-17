import {
  Suspense,
} from "react";

import {
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

import RefundSettingsForm from "@/components/renter/RefundSettingsForm";

import {
  prisma,
} from "@/lib/prisma";

import {
  requireRenter,
} from "@/lib/session";

async function RefundSettingsContent() {
  const renter =
    await requireRenter();

  const profile =
    await prisma.renterRefundProfile.findUnique({
      where: {
        renterId:
          renter.id,
      },
    });

  return (
    <main className="p-5 md:p-8 lg:p-10">
      <div className="mx-auto max-w-4xl">
        <div>
          <p className="text-sm font-medium text-zinc-500">
            Renter account
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
            Refund settings
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Choose where GoGoRent should return your security deposit after a successful rental.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
                <RotateCcw className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-zinc-950">
                  Refund destination
                </h2>

                <p className="text-sm text-zinc-500">
                  Used for security deposit refunds.
                </p>
              </div>
            </div>

            <RefundSettingsForm
              initial={{
                method:
                  profile?.method ??
                  "BANK_TRANSFER",

                accountName:
                  profile?.accountName ??
                  "",

                bankName:
                  profile?.bankName ??
                  "",

                accountNumber:
                  profile?.accountNumber ??
                  "",

                promptPayId:
                  profile?.promptPayId ??
                  "",
              }}
            />
          </section>

          <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-5">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />

            <h2 className="mt-3 font-semibold">
              How refunds work
            </h2>

            <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-500">
              <p>
                1. You pay the rental fee and deposit.
              </p>

              <p>
                2. GoGoRent holds the deposit.
              </p>

              <p>
                3. You return the device.
              </p>

              <p>
                4. The owner confirms the return.
              </p>

              <p>
                5. Admin sends the deposit to this refund method.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function RefundSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-zinc-500">
          Loading refund settings...
        </div>
      }
    >
      <RefundSettingsContent />
    </Suspense>
  );
}