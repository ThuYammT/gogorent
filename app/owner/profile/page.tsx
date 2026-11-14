import { Suspense } from "react";

import {
  BadgeCheck,
  CalendarDays,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import OwnerProfileForm from "@/components/owner/OwnerProfileForm";

import { requireOwner } from "@/lib/session";

/* ======================================================
   INITIALS
====================================================== */

function getInitials(
  name: string,
) {
  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    parts.length === 0
  ) {
    return "O";
  }

  if (
    parts.length === 1
  ) {
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

/* ======================================================
   CONTENT
====================================================== */

async function ProfileContent() {
  const owner =
    await requireOwner();

  return (
    <>
      {/* HEADER */}
      <header className="border-b border-zinc-200 bg-white px-6 py-8 md:px-10 xl:px-12">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-sm font-medium text-zinc-500">
            Account management
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
            Owner Profile
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Manage your public owner information and account details.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-6 py-8 md:px-10 xl:px-12">
        <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
          {/* ACCOUNT CARD */}
          <aside className="space-y-5">
            <section className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-950 text-xl font-bold text-white">
                  {getInitials(
                    owner.name,
                  )}
                </div>

                <h2 className="mt-4 text-lg font-semibold text-zinc-950">
                  {
                    owner.name
                  }
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Device Owner
                </p>

                {owner.isVerified ? (
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                    <BadgeCheck className="h-4 w-4" />
                    Verified owner
                  </span>
                ) : (
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-600">
                    <ShieldCheck className="h-4 w-4" />
                    Standard owner
                  </span>
                )}
              </div>
            </section>

            {/* ACCOUNT INFO */}
            <section className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-zinc-950">
                Account information
              </h2>

              <div className="mt-5 space-y-5">
                <div className="flex gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />

                  <div className="min-w-0">
                    <p className="text-xs text-zinc-500">
                      Email
                    </p>

                    <p className="mt-1 truncate text-sm font-medium text-zinc-900">
                      {
                        owner.email
                      }
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />

                  <div>
                    <p className="text-xs text-zinc-500">
                      Role
                    </p>

                    <p className="mt-1 text-sm font-medium text-zinc-900">
                      Owner
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />

                  <div>
                    <p className="text-xs text-zinc-500">
                      Member since
                    </p>

                    <p className="mt-1 text-sm font-medium text-zinc-900">
                      {owner.createdAt.toLocaleDateString(
                        undefined,
                        {
                          month:
                            "long",

                          year:
                            "numeric",
                        },
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-lg bg-zinc-50 p-4">
                <p className="text-xs leading-5 text-zinc-500">
                  Your email and account role are managed by GoGoRent and
                  cannot be changed from this page.
                </p>
              </div>
            </section>
          </aside>

          {/* EDIT FORM */}
          <main>
            <OwnerProfileForm
              owner={{
                name:
                  owner.name,

                phone:
                  owner.phone,

                location:
                  owner.location,

                bio:
                  owner.bio,
              }}
            />
          </main>
        </div>
      </div>
    </>
  );
}

/* ======================================================
   LOADING
====================================================== */

function ProfileLoading() {
  return (
    <div className="p-8 md:p-10">
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <div className="h-[450px] animate-pulse rounded-2xl bg-white" />

        <div className="h-[620px] animate-pulse rounded-2xl bg-white" />
      </div>
    </div>
  );
}

export default function OwnerProfilePage() {
  return (
    <Suspense
      fallback={
        <ProfileLoading />
      }
    >
      <ProfileContent />
    </Suspense>
  );
}