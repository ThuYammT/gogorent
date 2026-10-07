import {
  Calendar,
  CheckCircle2,
  Heart,
  MapPin,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react";

import Navbar from "@/components/layout/Navbar";

export default function DeviceDetailPage() {
  return (
    <main className="min-h-screen bg-[#fffdf7]">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-10">
        <p className="mb-7 text-sm font-semibold text-zinc-400">
          Explore / Cameras / Sony A6400
        </p>

        <div className="grid gap-10 lg:grid-cols-[1.3fr_.7fr]">
          <div>
            <div className="flex min-h-[480px] items-center justify-center rounded-[40px] bg-gradient-to-br from-yellow-100 via-amber-50 to-orange-100">
              <span className="text-[180px]">
                📷
              </span>
            </div>

            <div className="mt-8">
              <span className="text-sm font-black uppercase tracking-wider text-orange-500">
                Camera
              </span>

              <div className="mt-2 flex items-start justify-between">
                <div>
                  <h1 className="text-4xl font-black">
                    Sony A6400 Camera
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-5 text-sm text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <b className="text-zinc-900">
                        4.9
                      </b>
                      (48 reviews)
                    </span>

                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      Bangkok
                    </span>
                  </div>
                </div>

                <button className="rounded-full bg-white p-4 shadow-sm">
                  <Heart />
                </button>
              </div>

              <div className="mt-8 border-t border-zinc-200 pt-8">
                <h2 className="text-xl font-black">
                  About this device
                </h2>

                <p className="mt-4 max-w-3xl leading-8 text-zinc-500">
                  Sony A6400 mirrorless camera in excellent
                  condition. Great for photography, content
                  creation and short video projects. Includes
                  battery, charger and kit lens.
                </p>
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
                      Alex Chen
                    </p>
                  </div>

                  <span className="flex items-center gap-1 rounded-full bg-green-50 px-4 py-2 text-xs font-bold text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RENT CARD */}

          <div>
            <div className="sticky top-28 rounded-[32px] border border-yellow-100 bg-white p-7 shadow-xl shadow-yellow-100/50">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black">
                  ฿420
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
                    Oct 10 — Oct 13
                  </span>
                </div>
              </div>

              <div className="mt-7 space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">
                    ฿420 × 3 days
                  </span>

                  <b>฿1,260</b>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-500">
                    Security deposit
                  </span>

                  <b>฿3,000</b>
                </div>

                <div className="border-t border-zinc-100 pt-4">
                  <div className="flex justify-between text-lg">
                    <b>Total</b>
                    <b>฿4,260</b>
                  </div>
                </div>
              </div>

              <button className="mt-7 w-full rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 py-4 font-black text-white shadow-lg shadow-orange-100 transition hover:scale-[1.02]">
                Request to rent
              </button>

              <p className="mt-4 text-center text-xs text-zinc-400">
                You won't be charged yet.
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
    </main>
  );
}