import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { CalendarDays, CircleDollarSign, Clock3, PackageCheck, Search } from "lucide-react";

import { prisma } from "@/lib/prisma";
import type { RentalStatus } from "@/lib/generated/prisma/client";

// ---------- status labels & colours (matches enum RentalStatus) ----------
const STATUSES: RentalStatus[] = [
  "REQUESTED",
  "APPROVED",
  "ACTIVE",
  "RETURNED",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
  "DISPUTED",
];

const STATUS_STYLE: Record<RentalStatus, string> = {
  REQUESTED: "bg-yellow-100 text-orange-600",
  APPROVED: "bg-blue-50 text-blue-600",
  ACTIVE: "bg-green-50 text-green-600",
  RETURNED: "bg-teal-50 text-teal-600",
  COMPLETED: "bg-zinc-100 text-zinc-600",
  REJECTED: "bg-red-50 text-red-500",
  CANCELLED: "bg-zinc-100 text-zinc-400",
  DISPUTED: "bg-purple-50 text-purple-600",
};

const label = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

const baht = (n: unknown) =>
  `฿${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

const day = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" });

// ---------- page ----------
export default function AdminRentalsPage({ searchParams }: PageProps<"/admin/rentals">) {
  return (
    <main className="min-h-screen bg-[#fafafa] p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <p className="font-bold text-orange-500">ADMIN</p>
        <h1 className="mt-1 text-4xl font-black">Rentals</h1>
        <p className="mt-2 text-zinc-500">Every rental on GoGoRent, newest first.</p>

        <Suspense fallback={<p className="mt-10 text-zinc-400">Loading rentals…</p>}>
          <RentalsContent searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function RentalsContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection(); // always read fresh data from the database
  const params = await searchParams;

  const statusParam = typeof params.status === "string" ? params.status.toUpperCase() : "";
  const status = STATUSES.includes(statusParam as RentalStatus) ? (statusParam as RentalStatus) : undefined;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  const where = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { device: { name: { contains: q, mode: "insensitive" as const } } },
            { renter: { name: { contains: q, mode: "insensitive" as const } } },
            { renter: { email: { contains: q, mode: "insensitive" as const } } },
            { owner: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [rentals, counts, revenue] = await Promise.all([
    prisma.rental.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        device: { select: { name: true, emoji: true, category: { select: { emoji: true } } } },
        renter: { select: { name: true, email: true } },
        owner: { select: { name: true } },
      },
    }),
    prisma.rental.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.rental.aggregate({
      where: { status: { in: ["ACTIVE", "RETURNED", "COMPLETED"] } },
      _sum: { rentalAmount: true },
    }),
  ]);

  const countOf = (s: RentalStatus) => counts.find((c) => c.status === s)?._count._all ?? 0;
  const total = counts.reduce((sum, c) => sum + c._count._all, 0);

  const stats = [
    { label: "Total rentals", value: total.toLocaleString(), icon: CalendarDays },
    { label: "Waiting for owner", value: countOf("REQUESTED").toLocaleString(), icon: Clock3 },
    { label: "Active now", value: countOf("ACTIVE").toLocaleString(), icon: PackageCheck },
    { label: "Rental revenue", value: baht(revenue._sum.rentalAmount ?? 0), icon: CircleDollarSign },
  ];

  const tabHref = (s?: RentalStatus) => {
    const sp = new URLSearchParams();
    if (s) sp.set("status", s);
    if (q) sp.set("q", q);
    const str = sp.toString();
    return str ? `/admin/rentals?${str}` : "/admin/rentals";
  };

  return (
    <>
      {/* stat cards */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[28px] bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100">
              <s.icon className="text-orange-500" />
            </div>
            <p className="mt-6 text-3xl font-black">{s.value}</p>
            <p className="text-sm text-zinc-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* search */}
      <form action="/admin/rentals" className="mt-8 flex gap-3 rounded-3xl bg-white p-3 shadow-sm">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="flex flex-1 items-center gap-3 rounded-2xl bg-zinc-50 px-4">
          <Search className="h-5 w-5 text-zinc-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search device, renter, email or owner…"
            className="w-full bg-transparent py-3 outline-none"
          />
        </div>
        <button className="rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 px-6 font-bold text-white">
          Search
        </button>
      </form>

      {/* status tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Tab href={tabHref()} active={!status} text="All" count={total} />
        {STATUSES.map((s) => (
          <Tab key={s} href={tabHref(s)} active={status === s} text={label(s)} count={countOf(s)} />
        ))}
      </div>

      {/* table */}
      <div className="mt-6 overflow-x-auto rounded-[28px] bg-white shadow-sm">
        {rentals.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-5xl">📭</p>
            <p className="mt-4 font-black">No rentals found</p>
            <p className="text-sm text-zinc-400">
              {q || status ? "Try a different search or status." : "Rentals will appear here once renters book devices."}
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-zinc-100 text-xs font-bold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="p-5">Device</th>
                <th className="p-5">Renter</th>
                <th className="p-5">Owner</th>
                <th className="p-5">Dates</th>
                <th className="p-5 text-right">Rental</th>
                <th className="p-5 text-right">Deposit</th>
                <th className="p-5 text-right">Total</th>
                <th className="p-5">Status</th>
              </tr>
            </thead>
            <tbody>
              {rentals.map((r) => (
                <tr key={r.id} className="border-b border-zinc-50 last:border-none hover:bg-yellow-50/40">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-2xl">
                        {r.device.emoji ?? r.device.category.emoji ?? "📦"}
                      </div>
                      <div>
                        <p className="font-black">{r.device.name}</p>
                        <p className="text-xs text-zinc-400">#{r.id.slice(-6)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <p className="font-semibold">{r.renter.name}</p>
                    <p className="text-xs text-zinc-400">{r.renter.email}</p>
                  </td>
                  <td className="p-5 font-semibold">{r.owner.name}</td>
                  <td className="p-5">
                    <p>
                      {day(r.startDate)} → {day(r.endDate)}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {r.totalDays} day{r.totalDays === 1 ? "" : "s"} · {baht(r.pricePerDay)}/day
                    </p>
                  </td>
                  <td className="p-5 text-right">{baht(r.rentalAmount)}</td>
                  <td className="p-5 text-right text-zinc-500">{baht(r.depositAmount)}</td>
                  <td className="p-5 text-right font-black">{baht(r.totalAmount)}</td>
                  <td className="p-5">
                    <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${STATUS_STYLE[r.status]}`}>
                      {label(r.status)}
                    </span>
                    {r.rejectReason && (
                      <p className="mt-1 max-w-[160px] truncate text-xs text-zinc-400" title={r.rejectReason}>
                        {r.rejectReason}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {rentals.length === 100 && (
        <p className="mt-4 text-center text-xs text-zinc-400">Showing the newest 100. Use search or a status to narrow it down.</p>
      )}
    </>
  );
}

function Tab({ href, active, text, count }: { href: string; active: boolean; text: string; count: number }) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-zinc-900 px-4 py-2 text-sm font-bold text-white"
          : "rounded-full bg-white px-4 py-2 text-sm font-bold text-zinc-600 shadow-sm transition hover:bg-yellow-100"
      }
    >
      {text} <span className={active ? "text-zinc-400" : "text-zinc-300"}>{count}</span>
    </Link>
  );
}
