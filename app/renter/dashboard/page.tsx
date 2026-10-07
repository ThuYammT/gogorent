import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  PackageCheck,
  Search,
  Sparkles,
} from "lucide-react";

export default function RenterDashboard() {
  return (
    <main className="min-h-screen bg-[#fafafa] p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="font-bold text-orange-500">
              RENTER DASHBOARD
            </p>

            <h1 className="mt-1 text-4xl font-black">
              Hey Alex 👋
            </h1>

            <p className="mt-2 text-zinc-500">
              Ready to find something useful today?
            </p>
          </div>

          <Link
            href="/devices"
            className="flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 font-bold text-white"
          >
            <Search className="h-5 w-5" />
            Browse devices
          </Link>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            {
              label: "Active Rentals",
              value: "2",
              icon: PackageCheck,
            },
            {
              label: "Pending Requests",
              value: "1",
              icon: Clock3,
            },
            {
              label: "Completed",
              value: "8",
              icon: CalendarDays,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-[28px] bg-white p-6 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100">
                <stat.icon className="text-orange-500" />
              </div>

              <p className="mt-7 text-3xl font-black">
                {stat.value}
              </p>

              <p className="text-sm text-zinc-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-[32px] bg-gradient-to-r from-yellow-300 to-orange-400 p-8 md:flex md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 font-bold text-orange-900">
              <Sparkles />
              Need something for your next project?
            </div>

            <h2 className="mt-3 text-3xl font-black text-zinc-900">
              Don't buy it. GoGo it.
            </h2>
          </div>

          <Link
            href="/devices"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-bold md:mt-0"
          >
            Explore
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <section className="mt-10">
          <h2 className="text-2xl font-black">
            Your rentals
          </h2>

          <div className="mt-5 overflow-hidden rounded-[28px] bg-white">
            {[
              [
                "📷",
                "Sony A6400",
                "Oct 10 — Oct 13",
                "Approved",
              ],
              [
                "💻",
                "MacBook Air M2",
                "Oct 17 — Oct 19",
                "Pending",
              ],
            ].map((rental) => (
              <div
                key={rental[1]}
                className="flex items-center gap-5 border-b border-zinc-100 p-6 last:border-none"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-50 text-3xl">
                  {rental[0]}
                </div>

                <div className="flex-1">
                  <p className="font-black">
                    {rental[1]}
                  </p>

                  <p className="text-sm text-zinc-400">
                    {rental[2]}
                  </p>
                </div>

                <span className="rounded-full bg-yellow-100 px-4 py-2 text-xs font-bold text-orange-600">
                  {rental[3]}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}