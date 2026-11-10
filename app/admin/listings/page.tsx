import {
  Suspense,
} from "react";

import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
  Package,
  Search,
} from "lucide-react";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 10;

type ListingsPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
  }>;
};

const filters = [
  "ALL",
  "PENDING_APPROVAL",
  "AVAILABLE",
  "RENTED",
  "UNAVAILABLE",
  "REJECTED",
] as const;

function statusStyle(
  status: string,
) {
  switch (status) {
    case "PENDING_APPROVAL":
      return "bg-amber-50 text-amber-700";

    case "AVAILABLE":
      return "bg-emerald-50 text-emerald-700";

    case "RENTED":
      return "bg-blue-50 text-blue-700";

    case "REJECTED":
      return "bg-red-50 text-red-700";

    default:
      return "bg-zinc-100 text-zinc-600";
  }
}

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

function hrefFor({
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
    params.set(
      "q",
      q,
    );
  }

  if (
    status !== "ALL"
  ) {
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
    ? `/admin/listings?${query}`
    : "/admin/listings";
}

async function ListingsContent({
  searchParams,
}: ListingsPageProps) {
  await requireAdmin();

  const params =
    await searchParams;

  const q =
    params.q?.trim() ??
    "";

  const selectedStatus =
    filters.includes(
      params.status as
        (typeof filters)[number],
    )
      ? params.status!
      : "ALL";

  const rawPage =
    Number(
      params.page ?? 1,
    );

  const page =
    Number.isFinite(
      rawPage,
    ) &&
    rawPage > 0
      ? Math.floor(
          rawPage,
        )
      : 1;

  const where = {
    ...(selectedStatus !==
    "ALL"
      ? {
          status:
            selectedStatus as
              | "PENDING_APPROVAL"
              | "AVAILABLE"
              | "RENTED"
              | "UNAVAILABLE"
              | "REJECTED",
        }
      : {}),

    ...(q
      ? {
          OR: [
            {
              name: {
                contains:
                  q,

                mode:
                  "insensitive" as const,
              },
            },

            {
              brand: {
                contains:
                  q,

                mode:
                  "insensitive" as const,
              },
            },

            {
              model: {
                contains:
                  q,

                mode:
                  "insensitive" as const,
              },
            },

            {
              owner: {
                name: {
                  contains:
                    q,

                  mode:
                    "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
  };

  const total =
    await prisma.device.count({
      where,
    });

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

  const devices =
    await prisma.device.findMany({
      where,

      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

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

  return (
    <>
      <header className="border-b border-zinc-200 bg-white px-6 py-8 md:px-10 xl:px-12">
        <div className="mx-auto max-w-[1500px]">
          <p className="text-sm font-medium text-zinc-500">
            Platform management
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Listings
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Review and manage devices submitted to the marketplace.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-6 py-8 md:px-10 xl:px-12">
        <section className="rounded-2xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 p-5">
            <form className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

              <input
                name="q"
                defaultValue={
                  q
                }
                placeholder="Search listing or owner..."
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
            {filters.map(
              (filter) => (
                <Link
                  key={filter}
                  href={hrefFor({
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

        <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          {devices.length ===
          0 ? (
            <div className="py-20 text-center">
              <Package className="mx-auto h-9 w-9 text-zinc-300" />

              <h2 className="mt-4 font-semibold">
                No listings found
              </h2>
            </div>
          ) : (
            <>
              <div className="divide-y divide-zinc-100">
                {devices.map(
                  (device) => (
                    <Link
                      key={
                        device.id
                      }
                      href={`/admin/listings/${device.id}`}
                      className="flex flex-col gap-4 px-6 py-5 transition hover:bg-zinc-50 md:flex-row md:items-center"
                    >
                      <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
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
                          <div className="flex h-full w-full items-center justify-center text-2xl">
                            {device.emoji ??
                              "📦"}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-zinc-950">
                            {
                              device.name
                            }
                          </p>

                          <span
                            className={`rounded-md px-2 py-1 text-[11px] font-semibold ${statusStyle(
                              device.status,
                            )}`}
                          >
                            {formatStatus(
                              device.status,
                            )}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-zinc-500">
                          {
                            device
                              .category
                              .name
                          }
                          {" · "}
                          {device.brand ??
                            "No brand"}
                          {device.model
                            ? ` ${device.model}`
                            : ""}
                        </p>

                        <p className="mt-1 text-xs text-zinc-400">
                          Owner:{" "}
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

                      <div className="shrink-0 md:text-right">
                        <p className="font-semibold">
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
                    </Link>
                  ),
                )}
              </div>

              <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-4">
                <p className="text-sm text-zinc-500">
                  Page{" "}
                  <b>
                    {safePage}
                  </b>{" "}
                  of{" "}
                  <b>
                    {totalPages}
                  </b>
                </p>

                <div className="flex gap-2">
                  {safePage >
                  1 ? (
                    <Link
                      href={hrefFor({
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
                      href={hrefFor({
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

function Loading() {
  return (
    <div className="p-10">
      <div className="h-[550px] animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

export default function ListingsPage({
  searchParams,
}: ListingsPageProps) {
  return (
    <Suspense
      fallback={
        <Loading />
      }
    >
      <ListingsContent
        searchParams={
          searchParams
        }
      />
    </Suspense>
  );
}