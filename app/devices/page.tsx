import {
  Search,
  SlidersHorizontal,
} from "lucide-react";

import DeviceCard from "@/components/devices/DeviceCard";
import Navbar from "@/components/layout/Navbar";
import { devices } from "@/lib/mock-data";

export default function DevicesPage() {
  return (
    <main className="min-h-screen bg-[#fffdf7]">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div>
          <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-bold text-orange-600">
            Explore ✨
          </span>

          <h1 className="mt-5 text-4xl font-black md:text-5xl">
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
              placeholder="Search laptop, camera, projector..."
              className="w-full bg-transparent py-4 outline-none"
            />
          </div>

          <button className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 px-5 py-4 font-bold">
            <SlidersHorizontal className="h-5 w-5" />
            Filters
          </button>

          <button className="rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 px-8 py-4 font-bold text-white">
            Search
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {[
            "All",
            "Laptop",
            "Camera",
            "Tablet",
            "Gaming",
            "Projector",
          ].map((category, index) => (
            <button
              key={category}
              className={
                index === 0
                  ? "rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white"
                  : "rounded-full bg-white px-5 py-2.5 text-sm font-bold text-zinc-600 shadow-sm transition hover:bg-yellow-100"
              }
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-12 flex items-center justify-between">
          <p className="font-bold text-zinc-500">
            Showing{" "}
            <span className="text-zinc-900">
              {devices.length}
            </span>{" "}
            devices
          </p>

          <select className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold outline-none">
            <option>Recommended</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Highest Rated</option>
          </select>
        </div>

        <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => (
            <DeviceCard
              key={device.id}
              {...device}
            />
          ))}
        </div>
      </section>
    </main>
  );
}