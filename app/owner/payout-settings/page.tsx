import {
  Suspense,
} from "react";

import {
  Landmark,
  ShieldCheck,
} from "lucide-react";

import PayoutSettingsForm from "@/components/owner/PayoutSettingsForm";

import {
  prisma,
} from "@/lib/prisma";

import {
  requireOwner,
} from "@/lib/session";

async function PayoutSettingsContent() {
  const owner =
    await requireOwner();

  const profile =
    await prisma.ownerPayoutProfile.findUnique({
      where: {
        ownerId:
          owner.id,
      },
    });

  return (
    <>
      <header className="border-b border-zinc-200 bg-white px-6 py-8 md:px-10 xl:px-12">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-medium text-zinc-500">
            Owner account
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
            Payout settings
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Choose where GoGoRent should send your rental earnings.
            Payouts are processed manually by the platform after a rental is successfully completed.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8 md:px-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
                <Landmark className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-zinc-950">
                  Payment destination
                </h2>

                <p className="text-sm text-zinc-500">
                  Used for owner payouts.
                </p>
              </div>
            </div>

            <PayoutSettingsForm
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

            <h2 className="mt-3 font-semibold text-zinc-950">
              How payouts work
            </h2>

            <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-500">
              <p>
                1. The renter pays GoGoRent.
              </p>

              <p>
                2. GoGoRent holds the payment during the rental.
              </p>

              <p>
                3. After a successful return, your payout becomes pending.
              </p>

              <p>
                4. An admin transfers the money to this payout method.
              </p>

              <p>
                5. The payout is marked completed.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

export default function PayoutSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-zinc-500">
          Loading payout settings...
        </div>
      }
    >
      <PayoutSettingsContent />
    </Suspense>
  );
}