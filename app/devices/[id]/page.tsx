import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Heart,
  MapPin,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import NavbarFallback from "@/components/layout/NavbarFallback";

import { prisma } from "@/lib/prisma";

type DeviceDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function DeviceDetailContent({
  params,
}: DeviceDetailPageProps) {
  const { id } =
    await params;

  return (
    <DeviceDetail
      id={id}
    />
  );
}

export default function DeviceDetailPage({
  params,
}: DeviceDetailPageProps) {
  return (
    <main className="min-h-screen bg-[#fffdf7]">
      <Suspense fallback={<NavbarFallback />}>
        <Navbar />
      </Suspense>

      <Suspense
        fallback={
          <DeviceDetailLoading />
        }
      >
        <DeviceDetailContent
          params={params}
        />
      </Suspense>
    </main>
  );
}

async function DeviceDetail({
  id,
}: {
  id: string;
}) {
  const device =
    await prisma.device.findUnique({
      where: {
        id,
      },

      include: {
        category:
          true,

        owner:
          true,

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

        reviews:
          true,
      },
    });

  if (
    !device ||
    device.status !==
      "AVAILABLE"
  ) {
    notFound();
  }

  const reviewCount =
    device.reviews.length;

  const primaryImage =
    device.images[0];

  const formattedCondition =
    device.condition
      .replaceAll(
        "_",
        " ",
      )
      .toLowerCase()
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase(),
      );

  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <Link
        href="/devices"
        className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-zinc-500 transition hover:text-orange-500"
      >
        <ArrowLeft className="h-4 w-4" />

        Back to devices
      </Link>

      <p className="mb-7 text-sm font-semibold text-zinc-400">
        Explore /{" "}
        {
          device.category
            .name
        }{" "}
        / {device.name}
      </p>

      <div className="grid gap-10 lg:grid-cols-[1.3fr_.7fr]">
        <div>
          {primaryImage ? (
            <div className="overflow-hidden rounded-[40px] bg-zinc-100">
              <div className="aspect-[4/3] max-h-[620px] overflow-hidden">
                <img
                  src={
                    primaryImage.url
                  }
                  alt={
                    device.name
                  }
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          ) : (
            <div className="flex min-h-[480px] items-center justify-center rounded-[40px] bg-gradient-to-br from-yellow-100 via-amber-50 to-orange-100">
              <span className="text-[180px]">
                {device.emoji ??
                  "📦"}
              </span>
            </div>
          )}

          {device.images.length >
            1 && (
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {device.images.map(
                (
                  image,
                ) => (
                  <div
                    key={
                      image.id
                    }
                    className={`relative aspect-[4/3] overflow-hidden rounded-2xl border-2 ${
                      image.isPrimary
                        ? "border-orange-400"
                        : "border-transparent"
                    } bg-zinc-100`}
                  >
                    <img
                      src={
                        image.url
                      }
                      alt={
                        device.name
                      }
                      className="h-full w-full object-cover"
                    />

                    {image.isPrimary && (
                      <span className="absolute bottom-2 left-2 rounded-full bg-zinc-950/90 px-2 py-1 text-[10px] font-bold text-white">
                        Cover
                      </span>
                    )}
                  </div>
                ),
              )}
            </div>
          )}

          <div className="mt-8">
            <span className="text-sm font-black uppercase tracking-wider text-orange-500">
              {
                device.category
                  .name
              }
            </span>

            <div className="mt-2 flex items-start justify-between gap-6">
              <div>
                <h1 className="text-4xl font-black text-zinc-900">
                  {
                    device.name
                  }
                </h1>

                <div className="mt-3 flex flex-wrap items-center gap-5 text-sm text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />

                    <b className="text-zinc-900">
                      {device.avgRating.toFixed(
                        1,
                      )}
                    </b>

                    <span>
                      (
                      {
                        reviewCount
                      }{" "}

                      {reviewCount ===
                      1
                        ? "review"
                        : "reviews"}
                      )
                    </span>
                  </span>

                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />

                    {device.location ??
                      "Location not specified"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="rounded-full bg-white p-4 shadow-sm transition hover:bg-yellow-50"
                aria-label="Add to favorites"
              >
                <Heart />
              </button>
            </div>

            <div className="mt-8 border-t border-zinc-200 pt-8">
              <h2 className="text-xl font-black">
                About this device
              </h2>

              <p className="mt-4 max-w-3xl leading-8 text-zinc-500">
                {
                  device.description
                }
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Brand
                  </p>

                  <p className="mt-2 font-black text-zinc-900">
                    {device.brand ??
                      "Not specified"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Model
                  </p>

                  <p className="mt-2 font-black text-zinc-900">
                    {device.model ??
                      "Not specified"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Condition
                  </p>

                  <p className="mt-2 font-black text-zinc-900">
                    {
                      formattedCondition
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-3xl bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100">
                  <UserRound className="text-orange-500" />
                </div>

                <div className="flex-1">
                  <p className="text-sm text-zinc-400">
                    Listed by
                  </p>

                  <p className="font-black">
                    {
                      device.owner
                        .name
                    }
                  </p>

                  {device.owner
                    .location && (
                    <p className="mt-1 text-xs text-zinc-400">
                      {
                        device.owner
                          .location
                      }
                    </p>
                  )}
                </div>

                {device.owner
                  .isVerified && (
                  <span className="flex items-center gap-1 rounded-full bg-green-50 px-4 py-2 text-xs font-bold text-green-600">
                    <CheckCircle2 className="h-4 w-4" />

                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="sticky top-28 rounded-[32px] border border-yellow-100 bg-white p-7 shadow-xl shadow-yellow-100/50">
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black">
                ฿
                {Number(
                  device.pricePerDay,
                ).toLocaleString()}
              </span>

              <span className="pb-1 text-zinc-400">
                / day
              </span>
            </div>

            <div className="mt-7">
              <label className="text-sm font-bold">
                Rental dates
              </label>

              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-4">
                <Calendar className="h-5 w-5 text-orange-500" />

                <span className="text-sm text-zinc-500">
                  Choose your rental dates
                </span>
              </div>
            </div>

            <div className="mt-7 space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">
                  Price per day
                </span>

                <b>
                  ฿
                  {Number(
                    device.pricePerDay,
                  ).toLocaleString()}
                </b>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-500">
                  Security deposit
                </span>

                <b>
                  ฿
                  {Number(
                    device.depositAmount,
                  ).toLocaleString()}
                </b>
              </div>
            </div>

            <button
              type="button"
              className="mt-7 w-full rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 py-4 font-black text-white shadow-lg shadow-orange-100 transition hover:scale-[1.02]"
            >
              Request to rent
            </button>

            <p className="mt-4 text-center text-xs text-zinc-400">
              Rental requests will be implemented in the next phase.
            </p>

            <div className="mt-7 flex items-center gap-3 rounded-2xl bg-green-50 p-4">
              <ShieldCheck className="text-green-600" />

              <div>
                <p className="text-sm font-bold text-green-700">
                  GoGoRent Protection
                </p>

                <p className="text-xs text-green-600">
                  Secure deposits & trusted rentals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DeviceDetailLoading() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <div className="grid gap-10 lg:grid-cols-[1.3fr_.7fr]">
        <div>
          <div className="h-[480px] animate-pulse rounded-[40px] bg-yellow-50" />

          <div className="mt-8 h-10 w-72 animate-pulse rounded bg-zinc-100" />

          <div className="mt-5 h-5 w-48 animate-pulse rounded bg-zinc-100" />

          <div className="mt-8 h-40 animate-pulse rounded-3xl bg-white" />
        </div>

        <div className="h-[420px] animate-pulse rounded-[32px] bg-white" />
      </div>
    </section>
  );
}