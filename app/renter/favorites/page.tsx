import Link from "next/link";
import { Suspense } from "react";
import { Heart } from "lucide-react";

import DeviceCard from "@/components/devices/DeviceCard";
import FavoriteButton from "@/components/devices/FavoriteButton";
import { prisma } from "@/lib/prisma";
import { requireRenter } from "@/lib/session";

async function FavoritesContent() {
  const renter = await requireRenter();

  const favorites = await prisma.favorite.findMany({
    where: {
      userId: renter.id,
    },
    include: {
      device: {
        include: {
          category: true,
          images: {
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
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
    <main className="min-h-screen bg-[#fafafa] p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <p className="font-bold text-orange-500">SAVED DEVICES</p>
        <h1 className="mt-1 text-4xl font-black">Your favorites</h1>
        <p className="mt-2 text-zinc-500">
          Devices you saved for later. Tap the heart to remove one.
        </p>

        {favorites.length === 0 ? (
          <div className="mt-10 rounded-[28px] bg-white px-6 py-16 text-center">
            <Heart className="mx-auto h-10 w-10 text-zinc-300" />
            <p className="mt-4 font-black">Nothing saved yet</p>
            <p className="mt-1 text-sm text-zinc-400">
              Tap the heart on any device to save it here.
            </p>
            <Link
              href="/devices"
              className="mt-6 inline-flex rounded-full bg-zinc-900 px-6 py-3 text-sm font-bold text-white"
            >
              Browse devices
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map(({ device }) => {
              const available = device.status === "AVAILABLE";

              return (
                <div key={device.id} className="relative">
                  {available ? (
                    <DeviceCard
                      id={device.id}
                      name={device.name}
                      category={device.category.name}
                      price={Number(device.pricePerDay)}
                      location={device.location ?? "Unknown location"}
                      rating={device.avgRating}
                      emoji={device.emoji ?? "📦"}
                      imageUrl={device.images[0]?.url ?? null}
                    />
                  ) : (
                    // The device page only shows available devices,
                    // so unavailable ones are shown without a link.
                    <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white opacity-70">
                      <div className="flex aspect-[4/3] items-center justify-center bg-zinc-100 text-[80px] grayscale">
                        {device.emoji ?? "📦"}
                      </div>
                      <div className="p-5">
                        <h3 className="truncate text-lg font-black">
                          {device.name}
                        </h3>
                        <p className="mt-2 text-sm font-bold text-zinc-400">
                          Currently unavailable
                        </p>
                      </div>
                    </div>
                  )}

                  <FavoriteButton
                    deviceId={device.id}
                    initialSaved
                    viewer="renter"
                    className="absolute right-4 top-4 p-3"
                  />
                </div>
              );
            })}
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
        <div className="p-6 text-sm text-zinc-500">Loading saved devices...</div>
      }
    >
      <FavoritesContent />
    </Suspense>
  );
}
