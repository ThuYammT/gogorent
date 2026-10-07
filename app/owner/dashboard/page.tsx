import Link from "next/link";
import {
  ArrowUpRight,
  CircleDollarSign,
  Clock3,
  Package,
  Plus,
  TrendingUp,
} from "lucide-react";

export default function OwnerDashboard() {
  const stats = [
    {
      label: "My Devices",
      value: "6",
      icon: Package,
    },
    {
      label: "Pending Requests",
      value: "3",
      icon: Clock3,
    },
    {
      label: "Active Rentals",
      value: "2",
      icon: TrendingUp,
    },
    {
      label: "Total Earnings",
      value: "฿8,450",
      icon: CircleDollarSign,
    },
  ];

  return (
    <main className="min-h-screen bg-[#fafafa] p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="font-bold text-orange-500">
              OWNER DASHBOARD
            </p>

            <h1 className="mt-1 text-4xl font-black">
              Your gear is working 💸
            </h1>

            <p className="mt-2 text-zinc-500">
              Manage listings and rental requests.
            </p>
          </div>

          <Link
            href="/owner/devices/new"
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-3 font-bold text-white"
          >
            <Plus />
            Add device
          </Link>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[28px] bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100">
                  <stat.icon className="text-orange-500" />
                </div>

                <ArrowUpRight className="text-zinc-300" />
              </div>

              <p className="mt-7 text-3xl font-black">
                {stat.value}
              </p>

              <p className="mt-1 text-sm text-zinc-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <section className="mt-10 grid gap-7 lg:grid-cols-2">
          <div className="rounded-[30px] bg-white p-7">
            <h2 className="text-xl font-black">
              Recent rental requests
            </h2>

            <div className="mt-6 space-y-5">
              {[
                [
                  "📷",
                  "Sony A6400",
                  "Mia",
                  "Oct 10–13",
                ],
                [
                  "🎮",
                  "Nintendo Switch",
                  "James",
                  "Oct 12–14",
                ],
              ].map((item) => (
                <div
                  key={item[1]}
                  className="flex items-center gap-4"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-50 text-2xl">
                    {item[0]}
                  </div>

                  <div className="flex-1">
                    <p className="font-bold">
                      {item[1]}
                    </p>

                    <p className="text-sm text-zinc-400">
                      {item[2]} • {item[3]}
                    </p>
                  </div>

                  <button className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-bold text-white">
                    Review
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] bg-zinc-900 p-7 text-white">
            <p className="text-sm font-bold text-yellow-400">
              THIS MONTH
            </p>

            <h2 className="mt-3 text-4xl font-black">
              ฿3,260
            </h2>

            <p className="mt-1 text-sm text-zinc-400">
              Rental earnings
            </p>

            <div className="mt-10 flex h-32 items-end gap-3">
              {[30, 55, 42, 80, 65, 95, 76].map(
                (height, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-t-xl bg-gradient-to-t from-orange-500 to-yellow-300"
                    style={{ height: `${height}%` }}
                  />
                ),
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}