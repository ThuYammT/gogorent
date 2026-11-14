import { Suspense } from "react";

import {
  Search,
} from "lucide-react";

import DeviceCard from "@/components/devices/DeviceCard";
import Navbar from "@/components/layout/Navbar";
import { prisma } from "@/lib/prisma";

type DevicesPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

async function DeviceResults({
  searchParams,
}: DevicesPageProps) {
  const params =
    await searchParams;

  const query =
    params.q?.trim() ?? "";

  const devices =
    await prisma.device.findMany({
      where: {
        status:
          "AVAILABLE",

        ...(query
          ? {
              OR: [
                {
                  name: {
                    contains:
                      query,
                    mode: "insensitive",
                  },
                },
                {
                  brand: {
                    contains:
                      query,
                    mode: "insensitive",
                  },
                },
                {
                  model: {
                    contains:
                      query,
                    mode: "insensitive",
                  },
                },
                {
                  category: {
                    name: {
                      contains:
                        query,
                      mode: "insensitive",
                    },
                  },
                },
              ],
            }
          : {}),
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

      orderBy: {
        createdAt:
          "desc",
      },
    });

  if (
    devices.length === 0
  ) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
        <p className="text-4xl">
          🔎
        </p>

        <h2 className="mt-4 text-lg font-semibold text-zinc-950">
          No devices found
        </h2>

        <p className="mt-2 text-sm text-zinc-500">
          Try another search
          or check back later.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          <span className="font-semibold text-zinc-950">
            {
              devices.length
            }
          </span>{" "}
          available{" "}
          {devices.length ===
          1
            ? "device"
            : "devices"}
        </p>
      </div>

      <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {devices.map(
          (device) => (
            <DeviceCard
              key={
                device.id
              }
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
          ),
        )}
      </div>
    </>
  );
}

function Loading() {
  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map(
        (item) => (
          <div
            key={item}
            className="h-80 animate-pulse rounded-2xl bg-zinc-100"
          />
        ),
      )}
    </div>
  );
}

export default function DevicesPage({
  searchParams,
}: DevicesPageProps) {
  return (
    <main className="min-h-screen bg-[#f7f7f8]">
      <Navbar />

      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-6">
          <p className="text-sm font-semibold text-amber-600">
            Marketplace
          </p>

          <h1 className="mt-1 text-4xl font-bold tracking-tight text-zinc-950">
            Find the device
            you need.
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
            Browse approved
            electronics from
            GoGoRent owners.
            Anyone can explore;
            renter accounts can
            send rental requests.
          </p>

          <form className="mt-7 flex max-w-2xl gap-2">
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4">
              <Search className="h-5 w-5 text-zinc-400" />

              <input
                type="search"
                name="q"
                placeholder="Laptop, camera, projector..."
                className="w-full bg-transparent py-3.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-zinc-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-6">
        <Suspense
          fallback={
            <Loading />
          }
        >
          <DeviceResults
            searchParams={
              searchParams
            }
          />
        </Suspense>
      </section>
    </main>
  );
}