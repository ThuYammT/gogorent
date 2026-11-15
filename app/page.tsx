import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Gamepad2,
  Laptop,
  MapPin,
  MousePointerClick,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Tablet,
  WalletCards,
  Zap,
} from "lucide-react";

import DeviceCard from "@/components/devices/DeviceCard";
import Navbar from "@/components/layout/Navbar";
import { prisma } from "@/lib/prisma";

/* ======================================================
   HERO PRODUCT
====================================================== */

async function HeroProduct() {
  const devices = await prisma.device.findMany({
    where: {
      status: "AVAILABLE",
    },

    include: {
      category: true,

      images: {
        orderBy: [
          {
            isPrimary: "desc",
          },
          {
            createdAt: "asc",
          },
        ],

        take: 1,
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    take: 20,
  });

  if (devices.length === 0) {
    return <EmptyHeroProduct />;
  }

  /*
   * Prefer rated devices.
   * If nobody has ratings yet, choose
   * from all available products.
   */
  const ratedDevices = devices
    .filter((device) => device.avgRating > 0)
    .sort((a, b) => b.avgRating - a.avgRating);

  const pool =
    ratedDevices.length > 0
      ? ratedDevices.slice(0, 5)
      : devices;

  const device =
    pool[
      Math.floor(
        Math.random() * pool.length,
      )
    ];

  const imageUrl =
    device.images[0]?.url ?? null;

  return (
    <div className="relative mx-auto w-full max-w-[560px] lg:ml-auto">
      {/* GLOW */}
      <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-amber-400/20 blur-[100px]" />

      {/* BACK DECORATION */}
      <div className="absolute -right-4 top-10 h-[85%] w-[88%] rotate-6 rounded-[40px] border border-amber-400/20 bg-gradient-to-br from-amber-400/10 to-orange-500/5" />

      {/* PRODUCT CARD */}
      <Link
        href={`/devices/${device.id}`}
        className="group relative block"
      >
        <div className="relative overflow-hidden rounded-[34px] border border-white/15 bg-white/[0.08] p-3 shadow-[0_40px_100px_rgba(0,0,0,0.55)] backdrop-blur-xl transition duration-500 hover:-translate-y-2 hover:rotate-[0.5deg]">
          <div className="overflow-hidden rounded-[27px] bg-white">
            {/* IMAGE */}
            <div className="relative aspect-[1.15/1] overflow-hidden bg-gradient-to-br from-zinc-100 via-white to-amber-50">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={device.name}
                  fill
                  priority
                  className="object-cover transition duration-700 group-hover:scale-[1.04]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[120px]">
                  {device.emoji ??
                    "📦"}
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/30 to-transparent" />

              {/* AVAILABLE */}
              <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Available
              </span>

              {/* CATEGORY */}
              <span className="absolute right-5 top-5 rounded-full bg-zinc-950/85 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                {device.category.name}
              </span>

              {/* PRICE */}
              <div className="absolute bottom-5 left-5 rounded-2xl border border-white/30 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
                  Rent from
                </p>

                <p className="mt-0.5 text-xl font-bold text-zinc-950">
                  ฿
                  {Number(
                    device.pricePerDay,
                  ).toLocaleString()}

                  <span className="ml-1 text-xs font-medium text-zinc-400">
                    / day
                  </span>
                </p>
              </div>
            </div>

            {/* DETAILS */}
            <div className="p-6">
              <div className="flex items-start justify-between gap-5">
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold tracking-tight text-zinc-950">
                    {device.name}
                  </h2>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />

                      {device.location ??
                        "Location not specified"}
                    </span>

                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />

                      {device.avgRating > 0
                        ? device.avgRating.toFixed(
                            1,
                          )
                        : "New"}
                    </span>
                  </div>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white transition group-hover:bg-amber-400 group-hover:text-zinc-950">
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* FLOATING BADGE 1 */}
      <div className="absolute -left-8 bottom-[22%] hidden animate-bounce rounded-2xl border border-white/10 bg-[#1b1c20]/95 p-3.5 shadow-2xl backdrop-blur-xl md:block [animation-duration:3.5s]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400">
            <ShieldCheck className="h-4 w-4 text-zinc-950" />
          </div>

          <div>
            <p className="text-xs font-semibold text-white">
              Protected rental
            </p>

            <p className="mt-0.5 text-[10px] text-zinc-500">
              Secure handover flow
            </p>
          </div>
        </div>
      </div>

      {/* FLOATING BADGE 2 */}
      <div className="absolute -right-5 bottom-4 hidden rounded-2xl border border-white/10 bg-white/95 px-4 py-3 shadow-xl md:block">
        <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
          Deposit
        </p>

        <p className="mt-0.5 text-sm font-bold text-zinc-950">
          ฿
          {Number(
            device.depositAmount,
          ).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function HeroProductLoading() {
  return (
    <div className="relative mx-auto w-full max-w-[560px] lg:ml-auto">
      <div className="aspect-[0.9/1] animate-pulse rounded-[34px] border border-white/10 bg-white/[0.05]" />
    </div>
  );
}

function EmptyHeroProduct() {
  return (
    <div className="relative mx-auto max-w-[520px] rounded-[34px] border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
      <div className="flex aspect-square flex-col items-center justify-center rounded-[27px] bg-white">
        <div className="text-7xl">
          📦
        </div>

        <p className="mt-5 font-semibold text-zinc-900">
          Marketplace coming alive
        </p>

        <p className="mt-1 text-sm text-zinc-400">
          Available listings will
          appear here.
        </p>
      </div>
    </div>
  );
}

/* ======================================================
   FEATURED PRODUCTS
====================================================== */

async function FeaturedProducts() {
  const devices =
    await prisma.device.findMany({
      where: {
        status: "AVAILABLE",
      },

      include: {
        category: true,

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

          take: 1,
        },
      },

      orderBy: [
        {
          avgRating:
            "desc",
        },
        {
          createdAt:
            "desc",
        },
      ],

      take: 6,
    });

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-6">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700">
            <Zap className="h-3.5 w-3.5" />
            READY TO RENT
          </div>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-950 md:text-4xl">
            Pick something.
            <br />
            <span className="text-zinc-400">
              Make it yours for a while.
            </span>
          </h2>
        </div>

        <Link
          href="/devices"
          className="group inline-flex w-fit items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-amber-300 hover:text-amber-700"
        >
          Explore marketplace

          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {devices.length === 0 ? (
        <div className="mt-9 rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
          <p className="text-4xl">
            📦
          </p>

          <h3 className="mt-4 font-semibold text-zinc-900">
            No available devices yet
          </h3>

          <p className="mt-1 text-sm text-zinc-500">
            Approved owner listings
            will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map(
            (device) => (
              <div
                key={
                  device.id
                }
                className="transition duration-300 hover:-translate-y-1"
              >
                <DeviceCard
                  id={
                    device.id
                  }
                  name={
                    device.name
                  }
                  category={
                    device
                      .category
                      .name
                  }
                  price={Number(
                    device.pricePerDay,
                  )}
                  location={
                    device.location ??
                    "Unknown location"
                  }
                  rating={
                    device.avgRating
                  }
                  emoji={
                    device.emoji ??
                    "📦"
                  }
                  imageUrl={
                    device
                      .images[0]
                      ?.url ??
                    null
                  }
                />
              </div>
            ),
          )}
        </div>
      )}
    </section>
  );
}

function FeaturedProductsLoading() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-6">
      <div className="h-10 w-80 animate-pulse rounded-xl bg-zinc-200" />

      <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map(
          (item) => (
            <div
              key={item}
              className="h-80 animate-pulse rounded-3xl bg-zinc-200"
            />
          ),
        )}
      </div>
    </section>
  );
}

/* ======================================================
   PAGE
====================================================== */

export default function Home() {
  const categories = [
    {
      name: "Laptops",
      description:
        "Work & study",
      icon: Laptop,
    },
    {
      name: "Cameras",
      description:
        "Create & capture",
      icon: Camera,
    },
    {
      name: "Tablets",
      description:
        "Portable power",
      icon: Tablet,
    },
    {
      name: "Gaming",
      description:
        "Play more",
      icon: Gamepad2,
    },
    {
      name: "Phones",
      description:
        "Stay connected",
      icon: Smartphone,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f6f6f7]">
      <Navbar />

      {/* ==================================================
          HERO
      ================================================== */}

      <section className="relative overflow-hidden bg-[#090a0c]">
        {/* ANIMATED BACKGROUND */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-48 h-[620px] w-[620px] animate-pulse rounded-full bg-amber-500/20 blur-[150px] [animation-duration:5s]" />

          <div className="absolute -right-48 top-10 h-[620px] w-[620px] animate-pulse rounded-full bg-orange-600/15 blur-[170px] [animation-duration:7s]" />

          <div className="absolute bottom-[-250px] left-[40%] h-[500px] w-[500px] rounded-full bg-yellow-300/10 blur-[160px]" />

          {/* GRID */}
          <div
            className="absolute inset-0 opacity-[0.055]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)",

              backgroundSize:
                "54px 54px",
            }}
          />

          {/* DECORATIVE LINE */}
          <div className="absolute left-[52%] top-[20%] hidden h-[420px] w-px rotate-[28deg] bg-gradient-to-b from-transparent via-amber-300/30 to-transparent lg:block" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-16 px-5 pb-28 pt-20 lg:min-h-[720px] lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-6 lg:pb-32 lg:pt-24">
          {/* LEFT */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/[0.07] px-4 py-2 text-xs font-semibold text-amber-300 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />

                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
              </span>

              THE SMARTER WAY TO USE TECH
            </div>

            <h1 className="mt-8 max-w-[720px] text-[52px] font-bold leading-[0.98] tracking-[-0.05em] text-white sm:text-6xl lg:text-[78px]">
              Don't buy it.
              <br />

              <span className="relative">
                <span className="bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                  Borrow the moment.
                </span>
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-zinc-400 md:text-lg">
              From study sessions to
              weekend shoots, get the
              electronics you need
              without paying the full
              price.
            </p>

            {/* BUTTONS */}
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/devices"
                className="group inline-flex items-center gap-3 rounded-xl bg-amber-400 px-5 py-3.5 text-sm font-semibold text-zinc-950 shadow-[0_16px_45px_rgba(251,191,36,.20)] transition duration-300 hover:-translate-y-0.5 hover:bg-amber-300"
              >
                Explore marketplace

                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
              </Link>

              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-5 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                Become a renter
              </Link>
            </div>

            {/* SMALL METRICS */}
            <div className="mt-11 flex flex-wrap gap-x-8 gap-y-5">
              <div>
                <p className="text-lg font-bold text-white">
                  Browse
                </p>

                <p className="text-xs text-zinc-500">
                  without an account
                </p>
              </div>

              <div className="hidden h-10 w-px bg-white/10 sm:block" />

              <div>
                <p className="text-lg font-bold text-white">
                  Request
                </p>

                <p className="text-xs text-zinc-500">
                  as a renter
                </p>
              </div>

              <div className="hidden h-10 w-px bg-white/10 sm:block" />

              <div>
                <p className="text-lg font-bold text-white">
                  Collect
                </p>

                <p className="text-xs text-zinc-500">
                  with secure QR
                </p>
              </div>
            </div>
          </div>

          {/* REAL HERO PRODUCT */}
          <Suspense
            fallback={
              <HeroProductLoading />
            }
          >
            <HeroProduct />
          </Suspense>
        </div>
      </section>

      {/* ==================================================
          CATEGORY FLOATING PANEL
      ================================================== */}

      <section className="relative z-10 -mt-14">
        <div className="mx-auto max-w-7xl px-5 lg:px-6">
          <div className="rounded-[28px] border border-zinc-200/80 bg-white p-4 shadow-[0_25px_80px_rgba(0,0,0,.10)] md:p-5">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
              {categories.map(
                (category) => {
                  const Icon =
                    category.icon;

                  return (
                    <Link
                      key={
                        category.name
                      }
                      href="/devices"
                      className="group relative overflow-hidden rounded-2xl px-4 py-5 transition duration-300 hover:bg-zinc-950"
                    >
                      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-300/0 blur-xl transition group-hover:bg-amber-300/30" />

                      <div className="relative">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 transition group-hover:bg-amber-400">
                          <Icon className="h-5 w-5 text-zinc-700 transition group-hover:text-zinc-950" />
                        </div>

                        <p className="mt-4 text-sm font-semibold text-zinc-950 transition group-hover:text-white">
                          {
                            category.name
                          }
                        </p>

                        <p className="mt-1 text-xs text-zinc-400">
                          {
                            category.description
                          }
                        </p>
                      </div>
                    </Link>
                  );
                },
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          FEATURED PRODUCTS
      ================================================== */}

      <Suspense
        fallback={
          <FeaturedProductsLoading />
        }
      >
        <FeaturedProducts />
      </Suspense>

      {/* ==================================================
          WHY RENT
      ================================================== */}

      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-6">
        <div className="grid overflow-hidden rounded-[32px] bg-zinc-950 lg:grid-cols-[.9fr_1.1fr]">
          {/* LEFT */}
          <div className="relative overflow-hidden p-8 md:p-12">
            <div className="absolute -left-20 -top-20 h-64 w-64 animate-pulse rounded-full bg-amber-400/20 blur-[80px]" />

            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400">
                <Zap className="h-5 w-5 text-zinc-950" />
              </div>

              <h2 className="mt-7 text-3xl font-bold tracking-tight text-white md:text-4xl">
                Some things aren't
                worth owning.
              </h2>

              <p className="mt-4 max-w-md text-sm leading-7 text-zinc-400">
                Use expensive technology
                when you need it. Give it
                back when you're done.
                That's the whole idea.
              </p>

              <Link
                href="/devices"
                className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-amber-300"
              >
                Find something to rent

                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* RIGHT */}
          <div className="grid border-t border-white/10 sm:grid-cols-2 lg:border-l lg:border-t-0">
            {[
              {
                number: "01",
                title:
                  "Only pay for usage",
                description:
                  "Don't spend thousands on something you need for three days.",
                icon: WalletCards,
              },

              {
                number: "02",
                title:
                  "Approved marketplace",
                description:
                  "Listings go through admin review before becoming public.",
                icon: CheckCircle2,
              },

              {
                number: "03",
                title:
                  "Direct owner requests",
                description:
                  "Renters choose dates and owners decide whether to approve.",
                icon:
                  MousePointerClick,
              },

              {
                number: "04",
                title:
                  "Secure handovers",
                description:
                  "QR-based collection keeps the rental process traceable.",
                icon: ShieldCheck,
              },
            ].map(
              (item) => {
                const Icon =
                  item.icon;

                return (
                  <div
                    key={
                      item.number
                    }
                    className="group border-b border-white/10 p-7 transition hover:bg-white/[0.04] sm:odd:border-r"
                  >
                    <div className="flex items-center justify-between">
                      <Icon className="h-5 w-5 text-amber-300" />

                      <span className="text-xs font-bold text-white/20">
                        {
                          item.number
                        }
                      </span>
                    </div>

                    <h3 className="mt-8 font-semibold text-white">
                      {
                        item.title
                      }
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      {
                        item.description
                      }
                    </p>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </section>

      {/* ==================================================
          HOW IT WORKS
      ================================================== */}

      <section
        id="how-it-works"
        className="border-y border-zinc-200 bg-white"
      >
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-6">
          <div className="grid gap-14 lg:grid-cols-[.7fr_1.3fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
                HOW GOGORENT WORKS
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-950 md:text-4xl">
                Four steps.
                <br />
                Zero confusion.
              </h2>

              <p className="mt-4 max-w-sm text-sm leading-7 text-zinc-500">
                Browse first, create an
                account when you're
                ready, and let GoGoRent
                handle the rental flow.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  number:
                    "01",
                  title:
                    "Explore without signing up",
                  description:
                    "Anyone can browse approved listings and compare devices.",
                  icon:
                    Search,
                },

                {
                  number:
                    "02",
                  title:
                    "Choose dates as a renter",
                  description:
                    "Create a renter account, select your rental period and submit your request.",
                  icon:
                    Smartphone,
                },

                {
                  number:
                    "03",
                  title:
                    "Owner approves the request",
                  description:
                    "The device owner reviews your booking and confirms availability.",
                  icon:
                    CheckCircle2,
                },

                {
                  number:
                    "04",
                  title:
                    "Scan, collect and go",
                  description:
                    "Use the secure QR collection workflow when receiving your device.",
                  icon:
                    ShieldCheck,
                },
              ].map(
                (
                  step,
                  index,
                ) => {
                  const Icon =
                    step.icon;

                  return (
                    <div
                      key={
                        step.number
                      }
                      className="group flex gap-5 rounded-2xl border border-zinc-200 bg-[#fafafa] p-5 transition duration-300 hover:translate-x-2 hover:border-amber-200 hover:bg-amber-50/50"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-950 transition group-hover:bg-amber-400">
                        <Icon className="h-5 w-5 text-white transition group-hover:text-zinc-950" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-zinc-950">
                              {
                                step.title
                              }
                            </h3>

                            <p className="mt-1 text-sm leading-6 text-zinc-500">
                              {
                                step.description
                              }
                            </p>
                          </div>

                          <span className="text-xs font-bold text-zinc-300">
                            {
                              step.number
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          FINAL CTA
      ================================================== */}

      <section className="px-5 py-20 lg:px-6">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[34px] bg-gradient-to-br from-amber-300 via-yellow-300 to-orange-400 p-8 md:p-14">
          <div className="pointer-events-none absolute -right-20 -top-28 h-[340px] w-[340px] rounded-full border-[60px] border-white/20" />

          <div className="pointer-events-none absolute -bottom-32 right-[20%] h-[300px] w-[300px] rounded-full bg-white/15 blur-3xl" />

          <div className="relative max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-700">
              YOUR NEXT DEVICE
              IS ALREADY HERE
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-950 md:text-5xl">
              Why own everything?
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-700">
              Browse the marketplace
              freely. When something
              catches your eye, create
              your renter account and
              request it.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/devices"
                className="group inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-zinc-800"
              >
                Browse now

                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>

              <Link
                href="/register"
                className="rounded-xl border border-zinc-900/15 bg-white/40 px-5 py-3 text-sm font-semibold text-zinc-900 backdrop-blur transition hover:bg-white/60"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-5 py-9 sm:flex-row sm:items-center lg:px-6">
          <div>
            <p className="text-lg font-bold tracking-tight text-zinc-950">
              GoGo
              <span className="text-amber-500">
                Rent
              </span>
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              Tech when you need it.
            </p>
          </div>

          <div className="flex gap-6 text-xs font-medium text-zinc-500">
            <Link
              href="/devices"
              className="hover:text-zinc-950"
            >
              Marketplace
            </Link>

            <Link
              href="/#how-it-works"
              className="hover:text-zinc-950"
            >
              How it works
            </Link>
          </div>

          <p className="text-xs text-zinc-400">
            © 2026 GoGoRent
          </p>
        </div>
      </footer>
    </main>
  );
}