import { Suspense } from "react";
import Link from "next/link";

import { logoutAction } from "@/app/login/actions";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const adminSections = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/rentals", label: "Rentals" },
  { href: "/admin/transactions", label: "Transactions" },
  { href: "/admin/damage-reports", label: "Damage reports" },
  { href: "/admin/audit-logs", label: "Audit logs" },
];

async function PendingApprovalsPanel() {
  await requireAdmin();
  const pendingDevices = await prisma.device.findMany({
    where: { status: "PENDING_APPROVAL" },
    include: {
      category: true,
      owner: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <section className="mt-10 rounded-xl border border-amber-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Pending items for approval</h2>
          <p className="mt-1 text-sm text-gray-600">
            Devices waiting for an administrator to review.
          </p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
          {pendingDevices.length} pending
        </span>
      </div>

      {pendingDevices.length === 0 ? (
        <p className="mt-6 rounded-lg bg-gray-50 p-5 text-sm text-gray-600">
          There are no devices waiting for approval.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-gray-100">
          {pendingDevices.map((device) => (
            <li
              key={device.id}
              className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-2xl"
                >
                  {device.emoji ?? "📦"}
                </span>
                <div>
                  <Link
                    href={`/admin/listings/${device.id}`}
                    className="font-semibold text-gray-900 hover:underline"
                  >
                    {device.name}
                  </Link>
                  <p className="text-sm text-gray-600">
                    {device.category.name}
                    {device.location ? ` · ${device.location}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Submitted by {device.owner.name} ({device.owner.email})
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-sm sm:text-right">
                <p className="font-semibold text-gray-900">
                  ฿{Number(device.pricePerDay).toLocaleString()} / day
                </p>
                <p className="mt-1 text-gray-500">
                  Submitted {device.createdAt.toLocaleDateString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PendingApprovalsLoading() {
  return (
    <section
      aria-label="Loading pending approvals"
      className="mt-10 h-40 animate-pulse rounded-xl border border-amber-200 bg-white p-6"
    />
  );
}

export default async function AdminDashboardPage() {
  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Admin dashboard</h1>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Log out
          </button>
        </form>
      </div>
      <p className="mt-2 text-gray-600">
        Manage users, listings, rentals, and platform activity.
      </p>

      <nav
        aria-label="Admin sections"
        className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {adminSections.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="rounded-lg border border-gray-200 p-5 font-medium hover:bg-gray-50"
          >
            {label}
          </Link>
        ))}
      </nav>

      <Suspense fallback={<PendingApprovalsLoading />}>
        <PendingApprovalsPanel />
      </Suspense>
    </main>
  );
}