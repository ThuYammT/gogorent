import { Suspense } from "react";

import {
  BadgeCheck,
  CalendarDays,
  Mail,
  ShieldCheck,
} from "lucide-react";

import AvatarUploader from "@/components/renter/AvatarUploader";
import RenterProfileForm from "@/components/renter/RenterProfileForm";
import { prisma } from "@/lib/prisma";
import { requireRenter } from "@/lib/session";

function getInitials(
  name: string,
) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "R";
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[
      parts.length - 1
    ][0]
  ).toUpperCase();
}

async function RenterProfileContent() {
  const renter =
    await requireRenter();

  const totalBookings =
    await prisma.rental.count({
      where: {
        renterId: renter.id,
      },
    });

  return (
    <main className="p-5 md:p-8 lg:p-10">
      <div className="mx-auto max-w-6xl">
        <div>
          <p className="text-sm font-semibold text-amber-600">
            Account settings
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
            Your profile
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Manage your personal
            information and profile
            photo.
          </p>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
              <AvatarUploader
                avatarUrl={
                  renter.avatarUrl
                }
                initials={getInitials(
                  renter.name,
                )}
              />

              <h2 className="mt-4 text-lg font-semibold text-zinc-950">
                {renter.name}
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Renter account
              </p>

              {renter.isVerified ? (
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  <BadgeCheck className="h-4 w-4" />
                  Verified renter
                </span>
              ) : (
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-600">
                  <ShieldCheck className="h-4 w-4" />
                  Not verified
                </span>
              )}
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-900">
                Account summary
              </h3>

              <div className="mt-5 space-y-5">
                <div className="flex gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

                  <div className="min-w-0">
                    <p className="text-xs text-zinc-500">
                      Email
                    </p>

                    <p className="truncate text-sm font-medium text-zinc-900">
                      {renter.email}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

                  <div>
                    <p className="text-xs text-zinc-500">
                      Member since
                    </p>

                    <p className="text-sm font-medium text-zinc-900">
                      {renter.createdAt.toLocaleDateString(
                        undefined,
                        {
                          month:
                            "long",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-zinc-50 p-4">
                <p className="text-2xl font-bold text-zinc-950">
                  {totalBookings}
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  {totalBookings === 1
                    ? "booking"
                    : "bookings"}{" "}
                  made
                </p>
              </div>
            </section>
          </aside>

          <div className="min-w-0">
            <RenterProfileForm
              renter={{
                name: renter.name,
                phone: renter.phone,
                location:
                  renter.location,
                bio: renter.bio,
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function RenterProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-zinc-500">
          Loading profile...
        </div>
      }
    >
      <RenterProfileContent />
    </Suspense>
  );
}