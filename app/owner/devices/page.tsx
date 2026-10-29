import { Suspense } from "react";
import Link from "next/link";

import {
  Box,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";

const PAGE_SIZE = 10;

type DeviceStatusFilter =
  | "PENDING_APPROVAL"
  | "AVAILABLE"
  | "RENTED"
  | "REJECTED"
  | "UNAVAILABLE";

type OwnerDevicesPageProps = {
  searchParams: Promise<{
    status?: string;
    q?: string;
    page?: string;
  }>;
};

const statusFilters = [
  {
    label: "All",
    value: "ALL",
  },
  {
    label: "Pending",
    value: "PENDING_APPROVAL",
  },
  {
    label: "Available",
    value: "AVAILABLE",
  },
  {
    label: "Rented",
    value: "RENTED",
  },
  {
    label: "Rejected",
    value: "REJECTED",
  },
];

function formatStatus(
  status: string,
) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function statusStyle(
  status: string,
) {
  switch (status) {
    case "AVAILABLE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "PENDING_APPROVAL":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "RENTED":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700";

    case "UNAVAILABLE":
      return "border-zinc-200 bg-zinc-100 text-zinc-600";

    default:
      return "border-zinc-200 bg-zinc-100 text-zinc-600";
  }
}

function createPageHref({
  page,
  status,
  search,
}: {
  page: number;
  status: string;
  search: string;
}) {
  const query =
    new URLSearchParams();

  if (
    status !== "ALL"
  ) {
    query.set(
      "status",
      status,
    );
  }

  if (search) {
    query.set(
      "q",
      search,
    );
  }

  if (page > 1) {
    query.set(
      "page",
      page.toString(),
    );
  }

  const queryString =
    query.toString();

  return queryString
    ? `/owner/devices?${queryString}`
    : "/owner/devices";
}

async function OwnerDevicesContent({
  searchParams,
}: OwnerDevicesPageProps) {
  const owner =
    await requireOwner();

  const params =
    await searchParams;

  const searchQuery =
    params.q?.trim() ??
    "";

  const selectedStatus =
    statusFilters.some(
      (filter) =>
        filter.value ===
        params.status,
    )
      ? params.status!
      : "ALL";

  const requestedPage =
    Number(
      params.page ?? "1",
    );

  const currentPage =
    Number.isFinite(
      requestedPage,
    ) &&
    requestedPage > 0
      ? Math.floor(
          requestedPage,
        )
      : 1;

  const deviceWhere = {
    ownerId:
      owner.id,

    ...(selectedStatus !==
    "ALL"
      ? {
          status:
            selectedStatus as DeviceStatusFilter,
        }
      : {}),

    ...(searchQuery
      ? {
          OR: [
            {
              name: {
                contains:
                  searchQuery,
                mode:
                  "insensitive" as const,
              },
            },

            {
              brand: {
                contains:
                  searchQuery,
                mode:
                  "insensitive" as const,
              },
            },

            {
              model: {
                contains:
                  searchQuery,
                mode:
                  "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const [
    totalFilteredDevices,
    counts,
  ] =
    await Promise.all([
      prisma.device.count({
        where:
          deviceWhere,
      }),

      prisma.device.groupBy({
        by: ["status"],

        where: {
          ownerId:
            owner.id,
        },

        _count: {
          _all:
            true,
        },
      }),
    ]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalFilteredDevices /
          PAGE_SIZE,
      ),
    );

  const safePage =
    Math.min(
      currentPage,
      totalPages,
    );

  const devices =
    await prisma.device.findMany({
      where:
        deviceWhere,

      include: {
        category:
          true,

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
          "desc",
      },

      skip:
        (safePage - 1) *
        PAGE_SIZE,

      take:
        PAGE_SIZE,
    });

  const totalOwnerDevices =
    counts.reduce(
      (
        total,
        item,
      ) =>
        total +
        item._count._all,
      0,
    );

  function countForStatus(
    status: string,
  ) {
    if (
      status === "ALL"
    ) {
      return totalOwnerDevices;
    }

    return (
      counts.find(
        (item) =>
          item.status ===
          status,
      )?._count._all ??
      0
    );
  }

  const startItem =
    totalFilteredDevices ===
    0
      ? 0
      : (safePage - 1) *
          PAGE_SIZE +
        1;

  const endItem =
    Math.min(
      safePage *
        PAGE_SIZE,
      totalFilteredDevices,
    );

  return (
    <>
      {/* HEADER */}
      <header className="border-b border-zinc-200 bg-white px-6 py-8 md:px-10 xl:px-12">
        <div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Inventory management
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
              My Devices
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Manage listings, photos,
              availability and pricing.
            </p>
          </div>

          <Link
            href="/owner/devices/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />

            Add device
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-6 py-8 md:px-10 xl:px-12">
        {/* SEARCH + FILTER */}
        <section className="rounded-2xl border border-zinc-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-zinc-100 p-5 lg:flex-row lg:items-center lg:justify-between">
            <form className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

              <input
                name="q"
                defaultValue={
                  searchQuery
                }
                placeholder="Search devices..."
                className="w-full rounded-lg border border-zinc-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-zinc-400"
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

            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <SlidersHorizontal className="h-4 w-4" />

              {totalFilteredDevices}{" "}
              {totalFilteredDevices ===
              1
                ? "listing"
                : "listings"}
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto px-5 py-3">
            {statusFilters.map(
              (filter) => {
                const active =
                  selectedStatus ===
                  filter.value;

                return (
                  <Link
                    key={
                      filter.value
                    }
                    href={createPageHref({
                      page: 1,
                      status:
                        filter.value,
                      search:
                        searchQuery,
                    })}
                    className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-zinc-950 text-white"
                        : "text-zinc-500 hover:bg-zinc-100"
                    }`}
                  >
                    {
                      filter.label
                    }

                    <span className="ml-2 text-xs opacity-70">
                      {countForStatus(
                        filter.value,
                      )}
                    </span>
                  </Link>
                );
              },
            )}
          </div>
        </section>

        {/* EMPTY */}
        {devices.length ===
        0 ? (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white py-16 text-center">
            <Box className="mx-auto h-8 w-8 text-zinc-300" />

            <h2 className="mt-4 font-semibold text-zinc-900">
              No matching devices
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Create a listing or adjust
              your search and filters.
            </p>
          </div>
        ) : (
          <>
            {/* TABLE */}
            <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_.9fr] border-b border-zinc-200 bg-zinc-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 lg:grid">
                <span>
                  Device
                </span>

                <span>
                  Status
                </span>

                <span>
                  Price
                </span>

                <span>
                  Location
                </span>

                <span className="text-right">
                  Added
                </span>
              </div>

              <div className="divide-y divide-zinc-100">
                {devices.map(
                  (
                    device,
                  ) => (
                    <Link
                      key={
                        device.id
                      }
                      href={`/owner/devices/${device.id}`}
                      className="grid gap-4 px-6 py-5 transition hover:bg-zinc-50 lg:grid-cols-[2fr_1fr_1fr_1fr_.9fr] lg:items-center"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                          {device
                            .images[0] ? (
                            <img
                              src={
                                device
                                  .images[0]
                                  .url
                              }
                              alt={
                                device.name
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xl">
                              {device.emoji ??
                                "📦"}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-900">
                            {
                              device.name
                            }
                          </p>

                          <p className="mt-1 truncate text-xs text-zinc-500">
                            {
                              device
                                .category
                                .name
                            }

                            {device.brand
                              ? ` · ${device.brand}`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <div>
                        <span
                          className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${statusStyle(
                            device.status,
                          )}`}
                        >
                          {formatStatus(
                            device.status,
                          )}
                        </span>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-zinc-900">
                          ฿
                          {Number(
                            device.pricePerDay,
                          ).toLocaleString()}
                        </p>

                        <p className="text-xs text-zinc-400">
                          per day
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-zinc-600">
                        <MapPin className="h-4 w-4 shrink-0 text-zinc-400" />

                        <span className="truncate">
                          {device.location ??
                            "Not specified"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-zinc-500 lg:justify-end">
                        <Clock3 className="h-4 w-4" />

                        {device.createdAt.toLocaleDateString()}
                      </div>
                    </Link>
                  ),
                )}
              </div>

              {/* PAGINATION */}
              <div className="flex flex-col gap-4 border-t border-zinc-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-zinc-500">
                  Showing{" "}
                  <span className="font-medium text-zinc-900">
                    {startItem}
                  </span>
                  {" "}–{" "}
                  <span className="font-medium text-zinc-900">
                    {endItem}
                  </span>
                  {" "}of{" "}
                  <span className="font-medium text-zinc-900">
                    {
                      totalFilteredDevices
                    }
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  {safePage >
                  1 ? (
                    <Link
                      href={createPageHref({
                        page:
                          safePage -
                          1,

                        status:
                          selectedStatus,

                        search:
                          searchQuery,
                      })}
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
                    >
                      <ChevronLeft className="h-4 w-4" />

                      Previous
                    </Link>
                  ) : (
                    <span className="inline-flex h-9 cursor-not-allowed items-center gap-1 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-300">
                      <ChevronLeft className="h-4 w-4" />

                      Previous
                    </span>
                  )}

                  <div className="hidden items-center gap-1 sm:flex">
                    {Array.from(
                      {
                        length:
                          totalPages,
                      },
                      (
                        _,
                        index,
                      ) =>
                        index +
                        1,
                    )
                      .filter(
                        (
                          pageNumber,
                        ) =>
                          pageNumber ===
                            1 ||
                          pageNumber ===
                            totalPages ||
                          Math.abs(
                            pageNumber -
                              safePage,
                          ) <=
                            1,
                      )
                      .map(
                        (
                          pageNumber,
                          index,
                          visiblePages,
                        ) => {
                          const previous =
                            visiblePages[
                              index -
                                1
                            ];

                          const showGap =
                            previous &&
                            pageNumber -
                              previous >
                              1;

                          return (
                            <div
                              key={
                                pageNumber
                              }
                              className="flex items-center gap-1"
                            >
                              {showGap && (
                                <span className="px-1 text-zinc-400">
                                  …
                                </span>
                              )}

                              <Link
                                href={createPageHref({
                                  page:
                                    pageNumber,

                                  status:
                                    selectedStatus,

                                  search:
                                    searchQuery,
                                })}
                                className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition ${
                                  pageNumber ===
                                  safePage
                                    ? "bg-zinc-950 text-white"
                                    : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                                }`}
                              >
                                {
                                  pageNumber
                                }
                              </Link>
                            </div>
                          );
                        },
                      )}
                  </div>

                  {safePage <
                  totalPages ? (
                    <Link
                      href={createPageHref({
                        page:
                          safePage +
                          1,

                        status:
                          selectedStatus,

                        search:
                          searchQuery,
                      })}
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
                    >
                      Next

                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span className="inline-flex h-9 cursor-not-allowed items-center gap-1 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-300">
                      Next

                      <ChevronRight className="h-4 w-4" />
                    </span>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}

function Loading() {
  return (
    <div className="p-10">
      <div className="h-[550px] animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

export default function OwnerDevicesPage({
  searchParams,
}: OwnerDevicesPageProps) {
  return (
    <Suspense
      fallback={
        <Loading />
      }
    >
      <OwnerDevicesContent
        searchParams={
          searchParams
        }
      />
    </Suspense>
  );
}