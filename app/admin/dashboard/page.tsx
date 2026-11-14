import { Suspense } from "react";
import Link from "next/link";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Package,
  ReceiptText,
  Store,
  Users,
} from "lucide-react";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

/* ======================================================
   DASHBOARD
====================================================== */

async function DashboardContent() {
  const admin =
    await requireAdmin();

  const [
    totalUsers,
    ownerCount,
    renterCount,
    activeRentals,
    pendingListings,
    transactionCount,
    openDamageReports,
    pendingDevices,
  ] =
    await Promise.all([
      prisma.user.count(),

      prisma.user.count({
        where: {
          role: "OWNER",
        },
      }),

      prisma.user.count({
        where: {
          role: "RENTER",
        },
      }),

      prisma.rental.count({
        where: {
          status:
            "ACTIVE",
        },
      }),

      prisma.device.count({
        where: {
          status:
            "PENDING_APPROVAL",
        },
      }),

      prisma.transaction.count(),

      prisma.damageReport.count({
        where: {
          status: {
            in: [
              "OPEN",
              "UNDER_REVIEW",
            ],
          },
        },
      }),

      prisma.device.findMany({
        where: {
          status:
            "PENDING_APPROVAL",
        },

        include: {
          category:
            true,

          owner: {
            select: {
              name:
                true,

              email:
                true,
            },
          },

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
            "asc",
        },

        take: 6,
      }),
    ]);

  const stats = [
    {
      label:
        "Total users",

      value:
        totalUsers,

      description:
        `${ownerCount} owners · ${renterCount} renters`,

      icon:
        Users,

      href:
        "/admin/users",
    },

    {
      label:
        "Pending listings",

      value:
        pendingListings,

      description:
        pendingListings > 0
          ? "Require administrator review"
          : "No listings waiting",

      icon:
        Store,

      href:
        "/admin/listings?status=PENDING_APPROVAL",
    },

    {
      label:
        "Active rentals",

      value:
        activeRentals,

      description:
        "Rentals currently in progress",

      icon:
        ClipboardList,

      href:
        "/admin/rentals?status=ACTIVE",
    },

    {
      label:
        "Transactions",

      value:
        transactionCount,

      description:
        "Platform transaction records",

      icon:
        ReceiptText,

      href:
        "/admin/transactions",
    },
  ];

  return (
    <>
      {/* HEADER */}
      <header className="border-b border-zinc-200 bg-white px-6 py-8 md:px-10 xl:px-12">
        <div className="mx-auto max-w-[1500px]">
          <p className="text-sm font-medium text-zinc-500">
            Administration
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950 md:text-4xl">
            Welcome back,{" "}
            {admin.name ??
              "Administrator"}
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Monitor users, listings, rentals and platform activity.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-6 py-8 md:px-10 xl:px-12">
        {/* MAIN STATS */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(
            (stat) => {
              const Icon =
                stat.icon;

              return (
                <Link
                  key={
                    stat.label
                  }
                  href={
                    stat.href
                  }
                  className="group rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-300 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-500">
                        {
                          stat.label
                        }
                      </p>

                      <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
                        {
                          stat.value
                        }
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 transition group-hover:bg-zinc-200">
                      <Icon className="h-5 w-5 text-zinc-700" />
                    </div>
                  </div>

                  <p className="mt-4 text-xs leading-5 text-zinc-400">
                    {
                      stat.description
                    }
                  </p>
                </Link>
              );
            },
          )}
        </section>

        {/* ATTENTION SUMMARY */}
        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {/* OWNERS */}
          <Link
            href="/admin/users?role=OWNER"
            className="rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Registered owners
                </p>

                <p className="mt-2 text-2xl font-semibold text-zinc-950">
                  {
                    ownerCount
                  }
                </p>
              </div>

              <Users className="h-5 w-5 text-zinc-400" />
            </div>
          </Link>

          {/* RENTERS */}
          <Link
            href="/admin/users?role=RENTER"
            className="rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Registered renters
                </p>

                <p className="mt-2 text-2xl font-semibold text-zinc-950">
                  {
                    renterCount
                  }
                </p>
              </div>

              <Users className="h-5 w-5 text-zinc-400" />
            </div>
          </Link>

          {/* DAMAGE */}
          <Link
            href="/admin/damage-reports"
            className={`rounded-2xl border p-5 transition ${
              openDamageReports >
              0
                ? "border-red-200 bg-red-50/50 hover:border-red-300"
                : "border-zinc-200 bg-white hover:border-zinc-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm font-medium ${
                    openDamageReports >
                    0
                      ? "text-red-700"
                      : "text-zinc-500"
                  }`}
                >
                  Damage reports requiring attention
                </p>

                <p className="mt-2 text-2xl font-semibold text-zinc-950">
                  {
                    openDamageReports
                  }
                </p>
              </div>

              <AlertTriangle
                className={`h-5 w-5 ${
                  openDamageReports >
                  0
                    ? "text-red-500"
                    : "text-zinc-400"
                }`}
              />
            </div>
          </Link>
        </section>

        {/* PENDING APPROVALS */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="flex flex-col justify-between gap-4 border-b border-zinc-100 px-6 py-5 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-zinc-950">
                  Pending listing approvals
                </h2>

                {pendingListings >
                  0 && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                    {
                      pendingListings
                    }
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-zinc-500">
                Review devices submitted by owners before they appear on the marketplace.
              </p>
            </div>

            <Link
              href="/admin/listings?status=PENDING_APPROVAL"
              className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 transition hover:text-zinc-950"
            >
              View all

              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {pendingDevices.length ===
          0 ? (
            <div className="px-6 py-16 text-center">
              <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-400" />

              <h3 className="mt-4 font-semibold text-zinc-900">
                All caught up
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                There are no listings waiting for administrator approval.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {pendingDevices.map(
                (
                  device,
                ) => {
                  const image =
                    device.images[0];

                  return (
                    <Link
                      key={
                        device.id
                      }
                      href={`/admin/listings/${device.id}`}
                      className="flex flex-col gap-4 px-6 py-5 transition hover:bg-zinc-50 sm:flex-row sm:items-center"
                    >
                      {/* IMAGE */}
                      <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                        {image ? (
                          <img
                            src={
                              image.url
                            }
                            alt={
                              device.name
                            }
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-2xl">
                            {device.emoji ??
                              "📦"}
                          </div>
                        )}
                      </div>

                      {/* DEVICE */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-zinc-950">
                            {
                              device.name
                            }
                          </p>

                          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            Pending approval
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-zinc-500">
                          {
                            device
                              .category
                              .name
                          }

                          {device.location
                            ? ` · ${device.location}`
                            : ""}
                        </p>

                        <p className="mt-1 truncate text-xs text-zinc-400">
                          Submitted by{" "}
                          {
                            device.owner
                              .name
                          }{" "}
                          ·{" "}
                          {
                            device.owner
                              .email
                          }
                        </p>
                      </div>

                      {/* PRICE */}
                      <div className="shrink-0 sm:text-right">
                        <p className="text-sm font-semibold text-zinc-950">
                          ฿
                          {Number(
                            device.pricePerDay,
                          ).toLocaleString()}
                          /day
                        </p>

                        <p className="mt-1 text-xs text-zinc-400">
                          {device.createdAt.toLocaleDateString()}
                        </p>
                      </div>

                      <ArrowRight className="hidden h-4 w-4 shrink-0 text-zinc-400 sm:block" />
                    </Link>
                  );
                },
              )}
            </div>
          )}
        </section>

        {/* QUICK ADMIN LINKS */}
        <section className="mt-6">
          <div className="mb-4">
            <h2 className="font-semibold text-zinc-950">
              Platform management
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Quick access to administrative tools.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Link
              href="/admin/users"
              className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-zinc-500" />

                <span className="text-sm font-semibold">
                  User management
                </span>
              </div>

              <ArrowRight className="h-4 w-4 text-zinc-400" />
            </Link>

            <Link
              href="/admin/listings"
              className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-zinc-500" />

                <span className="text-sm font-semibold">
                  Listing management
                </span>
              </div>

              <ArrowRight className="h-4 w-4 text-zinc-400" />
            </Link>

            <Link
              href="/admin/audit-logs"
              className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-zinc-500" />

                <span className="text-sm font-semibold">
                  Audit logs
                </span>
              </div>

              <ArrowRight className="h-4 w-4 text-zinc-400" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

/* ======================================================
   LOADING
====================================================== */

function DashboardLoading() {
  return (
    <div className="p-8 md:p-10">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map(
          (item) => (
            <div
              key={item}
              className="h-40 animate-pulse rounded-2xl bg-white"
            />
          ),
        )}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map(
          (item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-2xl bg-white"
            />
          ),
        )}
      </div>

      <div className="mt-6 h-[420px] animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

/* ======================================================
   PAGE
====================================================== */

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <DashboardLoading />
      }
    >
      <DashboardContent />
    </Suspense>
  );
}