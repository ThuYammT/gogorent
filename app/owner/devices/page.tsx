import { Suspense } from "react";
import Link from "next/link";

import {
  Box,
  Clock3,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";

type OwnerDevicesPageProps = {
  searchParams: Promise<{
    status?: string;
    q?: string;
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
      (
        letter,
      ) =>
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

    default:
      return "border-zinc-200 bg-zinc-100 text-zinc-600";
  }
}

async function OwnerDevicesContent({
  searchParams,
}: OwnerDevicesPageProps) {
  const owner =
    await requireOwner();

  const params =
    await searchParams;

  const selectedStatus =
    params.status ??
    "ALL";

  const searchQuery =
    params.q?.trim() ??
    "";

  const devices =
    await prisma.device.findMany({
      where: {
        ownerId:
          owner.id,

        ...(selectedStatus !==
        "ALL"
          ? {
              status:
                selectedStatus as
                  | "PENDING_APPROVAL"
                  | "AVAILABLE"
                  | "RENTED"
                  | "REJECTED"
                  | "UNAVAILABLE",
            }
          : {}),

        ...(searchQuery
          ? {
              OR: [
                {
                  name: {
                    contains:
                      searchQuery,
                    mode: "insensitive",
                  },
                },
                {
                  brand: {
                    contains:
                      searchQuery,
                    mode: "insensitive",
                  },
                },
                {
                  model: {
                    contains:
                      searchQuery,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
      },

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
    });

  const counts =
    await prisma.device.groupBy({
      by: ["status"],

      where: {
        ownerId:
          owner.id,
      },

      _count: {
        _all: true,
      },
    });

  const totalDevices =
    counts.reduce(
      (
        sum,
        item,
      ) =>
        sum +
        item._count
          ._all,
      0,
    );

  function countForStatus(
    status: string,
  ) {
    if (
      status === "ALL"
    ) {
      return totalDevices;
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

  return (
    <>
      <header className="border-b border-zinc-200 bg-white px-6 py-8 md:px-10 xl:px-12">
        <div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Inventory management
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              My Devices
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Manage your listings, photos, availability and pricing.
            </p>
          </div>

          <Link
            href="/owner/devices/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
            Add device
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-6 py-8 md:px-10 xl:px-12">
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

            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <SlidersHorizontal className="h-4 w-4" />

              {devices.length}{" "}
              {devices.length ===
              1
                ? "listing"
                : "listings"}
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto px-5 py-3">
            {statusFilters.map(
              (
                filter,
              ) => {
                const active =
                  selectedStatus ===
                  filter.value;

                const query =
                  new URLSearchParams();

                if (
                  filter.value !==
                  "ALL"
                ) {
                  query.set(
                    "status",
                    filter.value,
                  );
                }

                if (
                  searchQuery
                ) {
                  query.set(
                    "q",
                    searchQuery,
                  );
                }

                const href =
                  query.toString()
                    ? `/owner/devices?${query.toString()}`
                    : "/owner/devices";

                return (
                  <Link
                    key={
                      filter.value
                    }
                    href={
                      href
                    }
                    className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
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

        {devices.length ===
        0 ? (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white py-16 text-center">
            <Box className="mx-auto h-8 w-8 text-zinc-300" />

            <h2 className="mt-4 font-semibold">
              No matching devices
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Create a listing or adjust your filters.
            </p>
          </div>
        ) : (
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
                        <p className="truncate text-sm font-semibold">
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
                      <p className="text-sm font-semibold">
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
                      <MapPin className="h-4 w-4 text-zinc-400" />

                      {device.location ??
                        "Not specified"}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-zinc-500 lg:justify-end">
                      <Clock3 className="h-4 w-4" />

                      {device.createdAt.toLocaleDateString()}
                    </div>
                  </Link>
                ),
              )}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function Loading() {
  return (
    <div className="p-10">
      <div className="h-[500px] animate-pulse rounded-2xl bg-white" />
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