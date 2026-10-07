import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Gamepad2,
  Laptop,
  ShieldCheck,
  Sparkles,
  Tablet,
  Wallet,
} from "lucide-react";

import DeviceCard from "@/components/devices/DeviceCard";
import Navbar from "@/components/layout/Navbar";
import { devices } from "@/lib/mock-data";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fffdf7]">
      <Navbar />

      {/* HERO */}

      <section className="relative overflow-hidden">
        <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-yellow-300/30 blur-3xl" />
        <div className="absolute -right-40 top-40 h-96 w-96 rounded-full bg-orange-300/30 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm font-bold text-orange-600">
              <Sparkles className="h-4 w-4" />
              Borrow cool tech. Save real money.
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[1.05] tracking-tight text-zinc-900 md:text-7xl">
              Need it?
              <br />
              <span className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                Rent it.
              </span>
              <br />
              Easy.
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-zinc-500">
              Laptops, cameras, gaming gear and more —
              rent what you need from people around you
              without paying full price.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/devices"
                className="flex items-center gap-2 rounded-full bg-zinc-900 px-7 py-4 font-bold text-white shadow-xl transition hover:-translate-y-1 hover:bg-orange-500"
              >
                Explore devices
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/owner/dashboard"
                className="rounded-full border border-zinc-200 bg-white px-7 py-4 font-bold text-zinc-800 transition hover:bg-yellow-50"
              >
                List your device
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-7 text-sm">
              <div>
                <p className="text-2xl font-black">500+</p>
                <p className="text-zinc-400">Devices</p>
              </div>

              <div className="h-10 w-px bg-zinc-200" />

              <div>
                <p className="text-2xl font-black">1.2K+</p>
                <p className="text-zinc-400">Renters</p>
              </div>

              <div className="h-10 w-px bg-zinc-200" />

              <div>
                <p className="text-2xl font-black">4.9 ★</p>
                <p className="text-zinc-400">Community</p>
              </div>
            </div>
          </div>

          {/* HERO CARD */}

          <div className="relative hidden lg:block">
            <div className="rotate-3 rounded-[40px] bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 p-8 shadow-2xl shadow-orange-200">
              <div className="rounded-[32px] bg-white p-7">
                <div className="flex h-72 items-center justify-center rounded-[25px] bg-gradient-to-br from-yellow-50 to-orange-100">
                  <span className="text-[140px]">
                    📷
                  </span>
                </div>

                <div className="mt-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
                    Trending now 🔥
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    Sony A6400 Camera
                  </h2>

                  <div className="mt-4 flex items-center justify-between">
                    <p className="font-black">
                      ฿420
                      <span className="text-sm font-normal text-zinc-400">
                        {" "}
                        / day
                      </span>
                    </p>

                    <span className="rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-600">
                      Available
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="font-bold text-orange-500">
              FIND YOUR THING
            </p>

            <h2 className="mt-2 text-3xl font-black">
              What are you looking for?
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ["Laptops", Laptop],
            ["Cameras", Camera],
            ["Tablets", Tablet],
            ["Gaming", Gamepad2],
          ].map(([name, Icon]) => {
            const IconComponent =
              Icon as typeof Laptop;

            return (
              <Link
                href="/devices"
                key={name as string}
                className="group flex items-center gap-4 rounded-3xl border border-yellow-100 bg-white p-5 transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100 transition group-hover:bg-gradient-to-br group-hover:from-yellow-400 group-hover:to-orange-500">
                  <IconComponent className="h-6 w-6 group-hover:text-white" />
                </div>

                <span className="font-bold">
                  {name as string}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURED */}

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-9">
          <p className="font-bold text-orange-500">
            POPULAR NEAR YOU
          </p>

          <div className="flex items-end justify-between">
            <h2 className="mt-2 text-3xl font-black">
              Tech worth borrowing.
            </h2>

            <Link
              href="/devices"
              className="hidden font-bold text-orange-500 md:block"
            >
              View everything →
            </Link>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {devices.slice(0, 6).map((device) => (
            <DeviceCard
              key={device.id}
              {...device}
            />
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}

      <section
        id="how-it-works"
        className="mx-auto max-w-7xl px-6 py-20"
      >
        <div className="rounded-[40px] bg-zinc-900 px-8 py-16 text-white md:px-14">
          <div className="max-w-xl">
            <p className="font-bold text-yellow-400">
              ZERO STRESS
            </p>

            <h2 className="mt-3 text-4xl font-black">
              Renting shouldn't be complicated.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Find your gear",
                description:
                  "Search nearby devices and choose what fits your budget.",
                icon: Sparkles,
              },
              {
                number: "02",
                title: "Request & rent",
                description:
                  "Choose your dates and send a rental request.",
                icon: Wallet,
              },
              {
                number: "03",
                title: "Use & return",
                description:
                  "Enjoy your device and return it safely when you're done.",
                icon: ShieldCheck,
              },
            ].map((item) => (
              <div
                key={item.number}
                className="rounded-3xl bg-white/10 p-7"
              >
                <div className="flex items-center justify-between">
                  <item.icon className="h-7 w-7 text-yellow-400" />

                  <span className="text-sm font-black text-white/30">
                    {item.number}
                  </span>
                </div>

                <h3 className="mt-8 text-xl font-black">
                  {item.title}
                </h3>

                <p className="mt-3 leading-7 text-zinc-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mt-20 border-t border-yellow-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-6 py-10 md:flex-row">
          <p className="font-black">
            GoGo<span className="text-orange-500">Rent</span>
          </p>

          <p className="text-sm text-zinc-400">
            © 2026 GoGoRent. Rent smarter.
          </p>
        </div>
      </footer>
    </main>
  );
}