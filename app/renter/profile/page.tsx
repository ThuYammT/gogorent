import { Suspense } from "react";
import { BadgeCheck, CalendarDays, Mail, ShieldCheck } from "lucide-react";

import RenterProfileForm from "@/components/renter/RenterProfileForm";
import { prisma } from "@/lib/prisma";
import { requireRenter } from "@/lib/session";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "R";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function RenterProfileContent() {
  const renter = await requireRenter();

  const totalBookings = await prisma.rental.count({
    where: {
      renterId: renter.id,
    },
  });

  return (
    <main className="min-h-screen bg-[#fafafa] p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        <p className="font-bold text-orange-500">MY PROFILE</p>
        <h1 className="mt-1 text-4xl font-black">Your account</h1>
        <p className="mt-2 text-zinc-500">
          Keep your details up to date so owners can reach you.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="space-y-5">
            <section className="rounded-[28px] bg-white p-6 text-center shadow-sm">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 text-2xl font-black text-zinc-900">
                {getInitials(renter.name)}
              </div>

              <h2 className="mt-4 text-lg font-black">{renter.name}</h2>
              <p className="text-sm text-zinc-400">Renter</p>

              {renter.isVerified ? (
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                  <BadgeCheck className="h-4 w-4" />
                  Verified renter
                </span>
              ) : (
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-600">
                  <ShieldCheck className="h-4 w-4" />
                  Not verified yet
                </span>
              )}
            </section>

            <section className="space-y-5 rounded-[28px] bg-white p-6 shadow-sm">
              <div className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                <div className="min-w-0">
                  <p className="text-xs text-zinc-400">Email</p>
                  <p className="truncate text-sm font-bold">{renter.email}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                <div>
                  <p className="text-xs text-zinc-400">Member since</p>
                  <p className="text-sm font-bold">
                    {renter.createdAt.toLocaleDateString(undefined, {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-yellow-50 p-4">
                <p className="text-3xl font-black">{totalBookings}</p>
                <p className="text-sm text-zinc-500">
                  {totalBookings === 1 ? "booking" : "bookings"} made
                </p>
              </div>

              <p className="text-xs leading-5 text-zinc-400">
                Your email can&apos;t be changed from this page.
              </p>
            </section>
          </aside>

          <RenterProfileForm
            renter={{
              name: renter.name,
              phone: renter.phone,
              location: renter.location,
              bio: renter.bio,
            }}
          />
        </div>
      </div>
    </main>
  );
}

export default function RenterProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-zinc-500">Loading profile...</div>
      }
    >
      <RenterProfileContent />
    </Suspense>
  );
}
