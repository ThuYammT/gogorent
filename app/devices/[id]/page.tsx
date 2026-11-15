import Link from "next/link";
import {
  notFound,
} from "next/navigation";
import { Suspense } from "react";

import {
  ArrowLeft,
  CheckCircle2,
  LayoutDashboard,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react";

import RentalRequestForm from "@/components/devices/RentalRequestForm";
import Navbar from "@/components/layout/Navbar";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type DeviceDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatCondition(
  condition: string,
) {
  return condition
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

async function DeviceDetailContent({
  params,
}: DeviceDetailPageProps) {
  const { id } =
    await params;

  const [
    device,
    session,
  ] = await Promise.all([
    prisma.device.findFirst({
      where: {
        id,
        status:
          "AVAILABLE",
      },

      include: {
        category: true,

        owner: {
          select: {
            name: true,
            location: true,
            isVerified:
              true,
          },
        },

        images: {
          orderBy: [
            {
              isPrimary:
                "desc",
            },
            {
              createdAt:
                "asc",
            },
          ],
        },

        reviews: true,
      },
    }),

    getSession(),
  ]);

  if (!device) {
    notFound();
  }

  const reviewCount =
    device.reviews.length;

  const image =
    device.images[0]
      ?.url ?? null;

  const dashboardHref =
    session?.role ===
    "ADMIN"
      ? "/admin/dashboard"
      : "/owner/dashboard";

  return (
    <section className="mx-auto max-w-7xl px-5 py-8 lg:px-6 lg:py-10">
      <Link
        href="/devices"
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-950"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to marketplace
      </Link>

      <div className="mt-6 grid gap-9 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* PRODUCT */}
        <div>
          <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={
                  device.name
                }
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center text-[140px]">
                {device.emoji ??
                  "📦"}
              </div>
            )}
          </div>

          <div className="mt-7">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="text-sm font-semibold text-amber-600">
                  {
                    device
                      .category
                      .name
                  }
                </p>

                <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950 md:text-4xl">
                  {
                    device.name
                  }
                </h1>

                <div className="mt-3 flex flex-wrap items-center gap-5 text-sm text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />

                    <span className="font-semibold text-zinc-900">
                      {device.avgRating.toFixed(
                        1,
                      )}
                    </span>

                    <span>
                      (
                      {
                        reviewCount
                      }{" "}
                      reviews)
                    </span>
                  </span>

                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />

                    {device.location ??
                      "Location not specified"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-zinc-200 pt-7">
              <h2 className="text-lg font-semibold text-zinc-950">
                About this
                device
              </h2>

              <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-zinc-600">
                {
                  device.description
                }
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label:
                      "Brand",
                    value:
                      device.brand ??
                      "Not specified",
                  },
                  {
                    label:
                      "Model",
                    value:
                      device.model ??
                      "Not specified",
                  },
                  {
                    label:
                      "Condition",
                    value:
                      formatCondition(
                        device.condition,
                      ),
                  },
                ].map(
                  (item) => (
                    <div
                      key={
                        item.label
                      }
                      className="rounded-2xl border border-zinc-200 bg-white p-4"
                    >
                      <p className="text-xs text-zinc-400">
                        {
                          item.label
                        }
                      </p>

                      <p className="mt-1 text-sm font-semibold text-zinc-900">
                        {
                          item.value
                        }
                      </p>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="mt-7 rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100">
                  <UserRound className="h-5 w-5 text-zinc-600" />
                </div>

                <div className="flex-1">
                  <p className="text-xs text-zinc-400">
                    Listed by
                  </p>

                  <p className="font-semibold text-zinc-900">
                    {
                      device.owner
                        .name
                    }
                  </p>
                </div>

                {device.owner
                  .isVerified && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RENT CARD */}
        <aside>
          <div className="sticky top-24 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold tracking-tight text-zinc-950">
                ฿
                {Number(
                  device.pricePerDay,
                ).toLocaleString()}
              </span>

              <span className="pb-1 text-sm text-zinc-400">
                / day
              </span>
            </div>

            <p className="mt-2 text-sm text-zinc-500">
              Security deposit:{" "}
              <span className="font-medium text-zinc-700">
                ฿
                {Number(
                  device.depositAmount,
                ).toLocaleString()}
              </span>
            </p>

            <div className="mt-6">
              {!session ? (
                <div>
                  <div className="rounded-xl bg-zinc-50 p-4">
                    <div className="flex gap-3">
                      <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                      <div>
                        <p className="text-sm font-semibold text-zinc-900">
                          Ready to
                          rent?
                        </p>

                        <p className="mt-1 text-sm leading-6 text-zinc-500">
                          Create a
                          renter
                          account or
                          log in to
                          choose your
                          dates.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2">
                    <Link
                      href="/register"
                      className="rounded-xl bg-amber-400 px-4 py-3 text-center text-sm font-semibold text-zinc-950 hover:bg-amber-300"
                    >
                      Create account
                    </Link>

                    <Link
                      href="/login"
                      className="rounded-xl border border-zinc-200 px-4 py-3 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      Log in
                    </Link>
                  </div>
                </div>
              ) : session.role ===
                "RENTER" ? (
                <RentalRequestForm
                  deviceId={
                    device.id
                  }
                  pricePerDay={Number(
                    device.pricePerDay,
                  )}
                  depositAmount={Number(
                    device.depositAmount,
                  )}
                />
              ) : (
                <div>
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-zinc-500" />

                      <div>
                        <p className="text-sm font-semibold text-zinc-900">
                          Renter accounts
                          only
                        </p>

                        <p className="mt-1 text-sm leading-6 text-zinc-500">
                          Owner and
                          admin
                          accounts can
                          browse the
                          marketplace,
                          but cannot
                          create
                          rental
                          requests.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={
                      dashboardHref
                    }
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Return to
                    dashboard
                  </Link>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3 border-t border-zinc-100 pt-5">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  GoGoRent
                  protection
                </p>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Rental details,
                  deposits and
                  handovers are
                  recorded through
                  GoGoRent.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default function DeviceDetailPage({
  params,
}: DeviceDetailPageProps) {
  return (
    <main className="min-h-screen bg-[#f7f7f8]">
      <Navbar />

      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-6 py-10 text-sm text-zinc-500">
            Loading device...
          </div>
        }
      >
        <DeviceDetailContent
          params={params}
        />
      </Suspense>
    </main>
  );
}