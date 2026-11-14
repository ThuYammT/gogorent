import { Suspense } from "react";

import {
  Search,
  SlidersHorizontal,
} from "lucide-react";

import DeviceCard from "@/components/devices/DeviceCard";
import Navbar from "@/components/layout/Navbar";
import NavbarFallback from "@/components/layout/NavbarFallback";

import { prisma } from "@/lib/prisma";

async function DeviceResults() {
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
  });

  if (devices.length === 0) {
    return (
      <div className="mt-10 rounded-[30px] border border-dashed border-yellow-200 bg-white p-12 text-center">
        <div className="text-5xl">
          📦
        </div>

        <h2 className="mt-5 text-2xl font-black text-zinc-900">
          No devices available yet
        </h2>

        <p className="mt-2 text-zinc-500">
          New approved rentals will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-12 flex items-center justify-between">
        <p className="font-bold text-zinc-500">
          Showing{" "}

          <span className="text-zinc-900">
            {devices.length}
          </span>{" "}

          devices
        </p>
      </div>

      <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {devices.map((device) => (
          <DeviceCard
            key={device.id}
            id={device.id}
            name={device.name}
            category={device.category.name}
            price={Number(device.pricePerDay)}
            location={device.location ?? "Unknown location"}
            rating={device.avgRating}
            emoji={device.emoji ?? "📦"}
            imageUrl={device.images[0]?.url ?? null}
          />
        ))}
      </div>
    </>
  );
}

function DeviceResultsLoading() {
  return (
    <div className="mt-12">
      <p className="font-bold text-zinc-400">
        Loading devices...
      </p>

      <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="h-80 animate-pulse rounded-[28px] bg-white"
          />
        ))}
      </div>
    </div>
  );
}

export default function DevicesPage() {
  return (
    <main className="min-h-screen bg-[#fffdf7]">
      <Suspense fallback={<NavbarFallback />}>
        <Navbar />
      </Suspense>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div>
          <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-bold text-orange-600">
            Explore ✨
          </span>

          <h1 className="mt-5 text-4xl font-black text-zinc-900 md:text-5xl">
            Find your next

            <span className="text-orange-500">
              {" "}rental.
            </span>
          </h1>

          <p className="mt-3 text-zinc-500">
            Why buy it when you only need it for a few days?
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm md:flex-row">
          <div className="flex flex-1 items-center gap-3 rounded-2xl bg-zinc-50 px-5">
            <Search className="h-5 w-5 text-zinc-400" />

            <input
              type="text"
              placeholder="Search laptop, camera, projector..."
              className="w-full bg-transparent py-4 text-zinc-900 outline-none placeholder:text-zinc-400"
            />
          </div>

          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 py-4 font-bold text-zinc-700 transition hover:bg-yellow-50"
          >
            <SlidersHorizontal className="h-5 w-5" />

            Filters
          </button>

          <button
            type="button"
            className="rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 px-8 py-4 font-bold text-white shadow-sm transition hover:scale-[1.02]"
          >
            Search
          </button>
        </div>

        <Suspense fallback={<DeviceResultsLoading />}>
          <DeviceResults />
        </Suspense>
      </section>
    </main>
  );
}