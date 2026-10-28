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

async function OwnerDevicesContent({
  searchParams,
}: OwnerDevicesPageProps) {
  const owner = await requireOwner();

  const params = await searchParams;

  const selectedStatus =
    params.status ?? "ALL";

  const searchQuery =
    params.q?.trim() ?? "";

  const devices =
    await prisma.device.findMany({
      where: {
        ownerId: owner.id,

        ...(selectedStatus !== "ALL"
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
        category: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

  const counts =
    await prisma.device.groupBy({
      by: ["status"],

      where: {
        ownerId: owner.id,
      },

      _count: {
        _all: true,
      },
    });

  const totalDevices = counts.reduce(
    (sum, item) =>
      sum + item._count._all,
    0,
  );

  function countForStatus(
    status: string,
  ) {
    if (status === "ALL") {
      return totalDevices;
    }

    return (
      counts.find(
        (item) =>
          item.status === status,
      )?._count._all ?? 0
    );
  }

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
              Manage your listings,
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
        {/* FILTER CARD */}
        <section className="rounded-2xl border border-zinc-200 bg-white">
          {/* SEARCH */}
          <div className="flex flex-col gap-4 border-b border-zinc-100 p-5 lg:flex-row lg:items-center lg:justify-between">
            <form className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

              <input
                name="q"
                defaultValue={
                  searchQuery
                }
                placeholder="Search devices..."
                className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-zinc-400"
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
              {devices.length === 1
                ? "listing"
                : "listings"}
            </div>
          </div>

          {/* STATUS FILTERS */}
          <div className="flex gap-1 overflow-x-auto px-5 py-3">
            {statusFilters.map(
              (filter) => {
                const active =
                  selectedStatus ===
                  filter.value;

                const hrefParams =
                  new URLSearchParams();

                if (
                  filter.value !==
                  "ALL"
                ) {
                  hrefParams.set(
                    "status",
                    filter.value,
                  );
                }

                if (searchQuery) {
                  hrefParams.set(
                    "q",
                    searchQuery,
                  );
                }

                const href =
                  hrefParams.toString()
                    ? `/owner/devices?${hrefParams.toString()}`
                    : "/owner/devices";

                return (
                  <Link
                    key={
                      filter.value
                    }
                    href={href}
                    className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-zinc-950 text-white"
                        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                    }`}
                  >
                    {filter.label}

                    <span
                      className={`ml-2 rounded-md px-1.5 py-0.5 text-[11px] ${
                        active
                          ? "bg-white/15 text-white"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
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
        {devices.length === 0 ? (
          <section className="mt-6 rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100">
              <Box className="h-6 w-6 text-zinc-400" />
            </div>

            <h2 className="mt-4 font-semibold text-zinc-800">
              {searchQuery ||
              selectedStatus !== "ALL"
                ? "No matching devices"
                : "No devices listed yet"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
              {searchQuery ||
              selectedStatus !== "ALL"
                ? "Try changing your search or filter."
                : "Create your first device listing to start renting on GoGoRent."}
            </p>

            {!searchQuery &&
              selectedStatus ===
                "ALL" && (
                <Link
                  href="/owner/devices/new"
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  <Plus className="h-4 w-4" />
                  Add first device
                </Link>
              )}
          </section>
        ) : (
          /* DEVICE TABLE */
          <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            {/* HEADER */}
            <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_.9fr] border-b border-zinc-200 bg-zinc-50 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 lg:grid">
              <span>Device</span>
              <span>Status</span>
              <span>Price</span>
              <span>Location</span>
              <span className="text-right">
                Added
              </span>
            </div>

            <div className="divide-y divide-zinc-100">
              {devices.map(
                (device) => (
                  <Link
                    key={device.id}
                    href={`/owner/devices/${device.id}`}
                    className="grid gap-4 px-6 py-5 transition hover:bg-zinc-50 lg:grid-cols-[2fr_1fr_1fr_1fr_.9fr] lg:items-center"
                  >
                    {/* DEVICE */}
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-xl">
                        {device.emoji ??
                          "📦"}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-950">
                          {
                            device.name
                          }
                        </p>

                        <p className="mt-1 truncate text-xs text-zinc-500">
                          {
                            device.category
                              .name
                          }

                          {device.brand
                            ? ` · ${device.brand}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    {/* STATUS */}
                    <div>
                      <span
                        className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${statusStyle(
                          device.status,
                        )}`}
                      >
                        {formatStatus(
                          device.status,
                        )}
                      </span>
                    </div>

                    {/* PRICE */}
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">
                        ฿
                        {Number(
                          device.pricePerDay,
                        ).toLocaleString()}
                      </p>

                      <p className="mt-0.5 text-xs text-zinc-400">
                        per day
                      </p>
                    </div>

                    {/* LOCATION */}
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                      <MapPin className="h-4 w-4 shrink-0 text-zinc-400" />

                      <span className="truncate">
                        {device.location ??
                          "Not specified"}
                      </span>
                    </div>

                    {/* DATE */}
                    <div className="flex items-center gap-2 text-sm text-zinc-500 lg:justify-end">
                      <Clock3 className="h-4 w-4 text-zinc-400" />

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

function OwnerDevicesLoading() {
  return (
    <div className="px-6 py-8 md:px-10 xl:px-12">
      <div className="mx-auto max-w-[1400px]">
        <div className="h-24 animate-pulse rounded-2xl bg-white" />

        <div className="mt-6 h-[450px] animate-pulse rounded-2xl bg-white" />
      </div>
    </div>
  );
}

export default function OwnerDevicesPage({
  searchParams,
}: OwnerDevicesPageProps) {
  return (
    <Suspense
      fallback={
        <OwnerDevicesLoading />
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