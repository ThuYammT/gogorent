import Link from "next/link";
import { Suspense } from "react";

import {
  Heart,
  Search,
} from "lucide-react";

import DeviceCard from "@/components/devices/DeviceCard";
import FavoriteButton from "@/components/devices/FavoriteButton";
import { prisma } from "@/lib/prisma";
import { requireRenter } from "@/lib/session";

async function FavoritesContent() {
  const renter =
    await requireRenter();

  const favorites =
    await prisma.favorite.findMany({
      where: {
        userId: renter.id,
      },
      include: {
        device: {
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
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  return (
    <main className="p-5 md:p-8 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold text-amber-600">
              Saved devices
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
              Your favorites
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Devices you saved while
              browsing the marketplace.
            </p>
          </div>

          <Link
            href="/devices"
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            <Search className="h-4 w-4" />
            Browse devices
          </Link>
        </div>

        {favorites.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100">
              <Heart className="h-6 w-6 text-zinc-400" />
            </div>

            <h2 className="mt-4 font-semibold text-zinc-900">
              No saved devices yet
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Save devices while browsing
              and they will appear here.
            </p>

            <Link
              href="/devices"
              className="mt-6 inline-flex rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Explore marketplace
            </Link>
          </section>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {favorites.map(
              ({ device }) => {
                const available =
                  device.status ===
                  "AVAILABLE";

                return (
                  <div
                    key={
                      device.id
                    }
                    className="relative"
                  >
                    {available ? (
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
                    ) : (
                      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white opacity-75 shadow-sm">
                        <div className="flex aspect-[4/3] items-center justify-center bg-zinc-100 text-[72px] grayscale">
                          {device.emoji ??
                            "📦"}
                        </div>

                        <div className="p-5">
                          <h3 className="truncate font-semibold text-zinc-900">
                            {
                              device.name
                            }
                          </h3>

                          <p className="mt-2 text-sm font-medium text-zinc-500">
                            Currently
                            unavailable
                          </p>
                        </div>
                      </div>
                    )}

                    <FavoriteButton
                      deviceId={
                        device.id
                      }
                      initialSaved
                      viewer="renter"
                      className="absolute right-4 top-4 p-3"
                    />
                  </div>
                );
              },
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function FavoritesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-zinc-500">
          Loading saved devices...
        </div>
      }
    >
      <FavoritesContent />
    </Suspense>
  );
}