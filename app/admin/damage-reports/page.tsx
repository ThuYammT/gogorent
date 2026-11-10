import { Suspense } from "react";
import Link from "next/link";

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Package,
  Search,
  UserRound,
} from "lucide-react";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 10;

type DamageReportsPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
  }>;
};

const statusFilters = [
  "ALL",
  "OPEN",
  "UNDER_REVIEW",
  "RESOLVED",
  "DISMISSED",
] as const;

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function statusStyle(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-red-50 text-red-700";

    case "UNDER_REVIEW":
      return "bg-amber-50 text-amber-700";

    case "RESOLVED":
      return "bg-emerald-50 text-emerald-700";

    case "DISMISSED":
      return "bg-zinc-100 text-zinc-600";

    default:
      return "bg-zinc-100 text-zinc-600";
  }
}

function createHref({
  q,
  status,
  page,
}: {
  q: string;
  status: string;
  page: number;
}) {
  const params =
    new URLSearchParams();

  if (q) {
    params.set("q", q);
  }

  if (status !== "ALL") {
    params.set(
      "status",
      status,
    );
  }

  if (page > 1) {
    params.set(
      "page",
      String(page),
    );
  }

  const query =
    params.toString();

  return query
    ? `/admin/damage-reports?${query}`
    : "/admin/damage-reports";
}

async function DamageReportsContent({
  searchParams,
}: DamageReportsPageProps) {
  await requireAdmin();

  const params =
    await searchParams;

  const q =
    params.q?.trim() ?? "";

  const selectedStatus =
    statusFilters.includes(
      params.status as
        (typeof statusFilters)[number],
    )
      ? params.status!
      : "ALL";

  const rawPage =
    Number(
      params.page ?? "1",
    );

  const page =
    Number.isFinite(rawPage) &&
    rawPage > 0
      ? Math.floor(rawPage)
      : 1;

  const where = {
    ...(selectedStatus !==
    "ALL"
      ? {
          status:
            selectedStatus as
              | "OPEN"
              | "UNDER_REVIEW"
              | "RESOLVED"
              | "DISMISSED",
        }
      : {}),

    ...(q
      ? {
          OR: [
            {
              rental: {
                device: {
                  name: {
                    contains: q,
                    mode:
                      "insensitive" as const,
                  },
                },
              },
            },

            {
              reporter: {
                name: {
                  contains: q,
                  mode:
                    "insensitive" as const,
                },
              },
            },

            {
              reporter: {
                email: {
                  contains: q,
                  mode:
                    "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
  };

  const [
    total,
    openCount,
    reviewingCount,
    resolvedCount,
  ] =
    await Promise.all([
      prisma.damageReport.count({
        where,
      }),

      prisma.damageReport.count({
        where: {
          status: "OPEN",
        },
      }),

      prisma.damageReport.count({
        where: {
          status:
            "UNDER_REVIEW",
        },
      }),

      prisma.damageReport.count({
        where: {
          status:
            "RESOLVED",
        },
      }),
    ]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        total /
          PAGE_SIZE,
      ),
    );

  const safePage =
    Math.min(
      page,
      totalPages,
    );

  const reports =
    await prisma.damageReport.findMany({
      where,

      include: {
        reporter: {
          select: {
            name: true,
            email: true,
          },
        },

        rental: {
          include: {
            device: {
              include: {
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
            },

            renter: {
              select: {
                name: true,
                email: true,
              },
            },

            owner: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt:
          "desc",
      },

      skip:
        (safePage - 1) *
        PAGE_SIZE,

      take:
        PAGE_SIZE,
    });

  const start =
    total === 0
      ? 0
      : (safePage - 1) *
          PAGE_SIZE +
        1;

  const end =
    Math.min(
      safePage *
        PAGE_SIZE,
      total,
    );

  return (
    <>
      {/* HEADER */}
      <header className="border-b border-zinc-200 bg-white px-6 py-8 md:px-10 xl:px-12">
        <div className="mx-auto max-w-[1500px]">
          <p className="text-sm font-medium text-zinc-500">
            Platform safety
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
            Damage Reports
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Monitor reported device damage and rental disputes requiring review.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-6 py-8 md:px-10 xl:px-12">
        {/* SUMMARY */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-red-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Open reports
                </p>

                <p className="mt-3 text-3xl font-semibold text-zinc-950">
                  {openCount}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Under review
                </p>

                <p className="mt-3 text-3xl font-semibold text-zinc-950">
                  {reviewingCount}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <Clock3 className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Resolved
                </p>

                <p className="mt-3 text-3xl font-semibold text-zinc-950">
                  {resolvedCount}
                </p>
              </div>

              <Package className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </section>

        {/* SEARCH + FILTERS */}
        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 p-5">
            <form className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

              <input
                name="q"
                defaultValue={q}
                placeholder="Search device or reporter..."
                className="w-full rounded-lg border border-zinc-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-zinc-400"
              />

              {selectedStatus !==
                "ALL" && (
                <input
                  type="hidden"
                  name="status"
                  value={
                    selectedStatus
                  }
                />
              )}
            </form>
          </div>

          <div className="flex gap-1 overflow-x-auto px-5 py-3">
            {statusFilters.map(
              (filter) => (
                <Link
                  key={filter}
                  href={createHref({
                    q,
                    status:
                      filter,
                    page: 1,
                  })}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                    selectedStatus ===
                    filter
                      ? "bg-zinc-950 text-white"
                      : "text-zinc-500 hover:bg-zinc-100"
                  }`}
                >
                  {filter ===
                  "ALL"
                    ? "All"
                    : formatStatus(
                        filter,
                      )}
                </Link>
              ),
            )}
          </div>
        </section>

        {/* REPORT LIST */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          {reports.length ===
          0 ? (
            <div className="px-6 py-20 text-center">
              <AlertTriangle className="mx-auto h-9 w-9 text-zinc-300" />

              <h2 className="mt-4 font-semibold text-zinc-900">
                No damage reports found
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Damage reports matching your filters will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-zinc-100">
                {reports.map(
                  (report) => {
                    const image =
                      report.rental
                        .device
                        .images[0];

                    return (
                      <div
                        key={
                          report.id
                        }
                        className="p-6"
                      >
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                          {/* DEVICE */}
                          <div className="flex min-w-0 flex-1 gap-4">
                            <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                              {image ? (
                                <img
                                  src={
                                    image.url
                                  }
                                  alt={
                                    report
                                      .rental
                                      .device
                                      .name
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-2xl">
                                  {report
                                    .rental
                                    .device
                                    .emoji ??
                                    "📦"}
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-zinc-950">
                                  {
                                    report
                                      .rental
                                      .device
                                      .name
                                  }
                                </p>

                                <span
                                  className={`rounded-md px-2.5 py-1 text-xs font-semibold ${statusStyle(
                                    report.status,
                                  )}`}
                                >
                                  {formatStatus(
                                    report.status,
                                  )}
                                </span>
                              </div>

                              <p className="mt-1 text-xs text-zinc-400">
                                Report #
                                {report.id.slice(
                                  -8,
                                )}
                                {" · "}
                                Rental #
                                {report.rentalId.slice(
                                  -6,
                                )}
                              </p>

                              <div className="mt-3 flex items-center gap-2 text-sm text-zinc-600">
                                <UserRound className="h-4 w-4 text-zinc-400" />

                                Reported by{" "}
                                <span className="font-medium text-zinc-900">
                                  {
                                    report
                                      .reporter
                                      .name
                                  }
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* PEOPLE */}
                          <div className="grid min-w-[300px] grid-cols-2 gap-5">
                            <div>
                              <p className="text-xs text-zinc-400">
                                Renter
                              </p>

                              <p className="mt-1 truncate text-sm font-medium text-zinc-700">
                                {
                                  report
                                    .rental
                                    .renter
                                    .name
                                }
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-zinc-400">
                                Owner
                              </p>

                              <p className="mt-1 truncate text-sm font-medium text-zinc-700">
                                {
                                  report
                                    .rental
                                    .owner
                                    .name
                                }
                              </p>
                            </div>
                          </div>

                          {/* DATE */}
                          <div className="shrink-0 lg:text-right">
                            <p className="text-sm text-zinc-500">
                              {report.createdAt.toLocaleDateString()}
                            </p>

                            <p className="mt-1 text-xs text-zinc-400">
                              {report.createdAt.toLocaleTimeString(
                                [],
                                {
                                  hour:
                                    "2-digit",
                                  minute:
                                    "2-digit",
                                },
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>

              {/* PAGINATION */}
              <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-4">
                <p className="text-sm text-zinc-500">
                  Showing{" "}
                  <b className="text-zinc-900">
                    {start}
                  </b>
                  {" "}–{" "}
                  <b className="text-zinc-900">
                    {end}
                  </b>
                  {" "}of{" "}
                  <b className="text-zinc-900">
                    {total}
                  </b>
                </p>

                <div className="flex gap-2">
                  {safePage > 1 ? (
                    <Link
                      href={createHref({
                        q,
                        status:
                          selectedStatus,
                        page:
                          safePage -
                          1,
                      })}
                      className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-300">
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </span>
                  )}

                  {safePage <
                  totalPages ? (
                    <Link
                      href={createHref({
                        q,
                        status:
                          selectedStatus,
                        page:
                          safePage +
                          1,
                      })}
                      className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-300">
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}

function DamageReportsLoading() {
  return (
    <div className="p-10">
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map(
          (item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-2xl bg-white"
            />
          ),
        )}
      </div>

      <div className="mt-6 h-[500px] animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

export default function AdminDamageReportsPage({
  searchParams,
}: DamageReportsPageProps) {
  return (
    <Suspense
      fallback={
        <DamageReportsLoading />
      }
    >
      <DamageReportsContent
        searchParams={
          searchParams
        }
      />
    </Suspense>
  );
}