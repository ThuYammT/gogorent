import {
  Suspense,
} from "react";

import Link from "next/link";

import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import {
  setUserStatus,
} from "./actions";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 10;

type UsersPageProps = {
  searchParams: Promise<{
    q?: string;
    role?: string;
    status?: string;
    page?: string;
  }>;
};

const roleFilters = [
  "ALL",
  "OWNER",
  "RENTER",
  "ADMIN",
] as const;

const statusFilters = [
  "ALL",
  "ACTIVE",
  "SUSPENDED",
] as const;

function createHref({
  q,
  role,
  status,
  page,
}: {
  q: string;
  role: string;
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
    role !== "ALL"
  ) {
    params.set(
      "role",
      role,
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
    ? `/admin/users?${query}`
    : "/admin/users";
}

function roleStyle(
  role: string,
) {
  switch (role) {
    case "ADMIN":
      return "bg-red-50 text-red-700";

    case "OWNER":
      return "bg-amber-50 text-amber-700";

    default:
      return "bg-blue-50 text-blue-700";
  }
}

async function UsersContent({
  searchParams,
}: UsersPageProps) {
  const admin =
    await requireAdmin();

  const params =
    await searchParams;

  const q =
    params.q?.trim() ??
    "";

  const role =
    roleFilters.includes(
      params.role as
        (typeof roleFilters)[number],
    )
      ? params.role!
      : "ALL";

  const status =
    statusFilters.includes(
      params.status as
        (typeof statusFilters)[number],
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
    ...(role !== "ALL"
      ? {
          role:
            role as
              | "ADMIN"
              | "OWNER"
              | "RENTER",
        }
      : {}),

    ...(status !==
    "ALL"
      ? {
          status:
            status as
              | "ACTIVE"
              | "SUSPENDED",
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
              email: {
                contains:
                  q,

                mode:
                  "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const totalUsers =
    await prisma.user.count({
      where,
    });

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalUsers /
          PAGE_SIZE,
      ),
    );

  const safePage =
    Math.min(
      page,
      totalPages,
    );

  const users =
    await prisma.user.findMany({
      where,

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
    totalUsers === 0
      ? 0
      : (safePage - 1) *
          PAGE_SIZE +
        1;

  const end =
    Math.min(
      safePage *
        PAGE_SIZE,
      totalUsers,
    );

  return (
    <>
      {/* HEADER */}
      <header className="border-b border-zinc-200 bg-white px-6 py-8 md:px-10 xl:px-12">
        <div className="mx-auto max-w-[1500px]">
          <p className="text-sm font-medium text-zinc-500">
            Platform management
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
            Users
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Review accounts and manage platform access.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-6 py-8 md:px-10 xl:px-12">
        {/* SEARCH */}
        <section className="rounded-2xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 p-5">
            <form className="flex max-w-xl gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                <input
                  name="q"
                  defaultValue={
                    q
                  }
                  placeholder="Search name or email..."
                  className="w-full rounded-lg border border-zinc-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-zinc-400"
                />

                {role !==
                  "ALL" && (
                  <input
                    type="hidden"
                    name="role"
                    value={
                      role
                    }
                  />
                )}

                {status !==
                  "ALL" && (
                  <input
                    type="hidden"
                    name="status"
                    value={
                      status
                    }
                  />
                )}
              </div>

              <button
                type="submit"
                className="rounded-lg bg-zinc-950 px-5 text-sm font-semibold text-white"
              >
                Search
              </button>
            </form>
          </div>

          {/* ROLE FILTER */}
          <div className="flex flex-wrap gap-1 px-5 pt-3">
            {roleFilters.map(
              (item) => (
                <Link
                  key={item}
                  href={createHref({
                    q,
                    role:
                      item,
                    status,
                    page: 1,
                  })}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    role ===
                    item
                      ? "bg-zinc-950 text-white"
                      : "text-zinc-500 hover:bg-zinc-100"
                  }`}
                >
                  {item ===
                  "ALL"
                    ? "All roles"
                    : item.charAt(
                        0,
                      ) +
                      item
                        .slice(1)
                        .toLowerCase()}
                </Link>
              ),
            )}
          </div>

          {/* STATUS FILTER */}
          <div className="flex flex-wrap gap-1 px-5 pb-3">
            {statusFilters.map(
              (item) => (
                <Link
                  key={item}
                  href={createHref({
                    q,
                    role,
                    status:
                      item,
                    page: 1,
                  })}
                  className={`rounded-lg px-3 py-2 text-xs font-medium ${
                    status ===
                    item
                      ? "bg-zinc-200 text-zinc-950"
                      : "text-zinc-400 hover:bg-zinc-100"
                  }`}
                >
                  {item ===
                  "ALL"
                    ? "All status"
                    : item.charAt(
                        0,
                      ) +
                      item
                        .slice(1)
                        .toLowerCase()}
                </Link>
              ),
            )}
          </div>
        </section>

        {/* TABLE */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          {users.length ===
          0 ? (
            <div className="py-20 text-center">
              <Users className="mx-auto h-9 w-9 text-zinc-300" />

              <h2 className="mt-4 font-semibold">
                No users found
              </h2>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <div className="min-w-[950px]">
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr] border-b border-zinc-100 bg-zinc-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    <span>
                      User
                    </span>

                    <span>
                      Role
                    </span>

                    <span>
                      Status
                    </span>

                    <span>
                      Joined
                    </span>

                    <span className="text-right">
                      Action
                    </span>
                  </div>

                  <div className="divide-y divide-zinc-100">
                    {users.map(
                      (user) => {
                        const isSelf =
                          user.id ===
                          admin.id;

                        const isAdmin =
                          user.role ===
                          "ADMIN";

                        const nextStatus =
                          user.status ===
                          "ACTIVE"
                            ? "SUSPENDED"
                            : "ACTIVE";

                        const action =
                          setUserStatus.bind(
                            null,
                            user.id,
                            nextStatus,
                          );

                        return (
                          <div
                            key={
                              user.id
                            }
                            className="grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr] items-center px-6 py-5"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
                                <UserRound className="h-5 w-5 text-zinc-500" />
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-zinc-950">
                                  {
                                    user.name
                                  }

                                  {isSelf && (
                                    <span className="ml-2 text-xs font-medium text-zinc-400">
                                      You
                                    </span>
                                  )}
                                </p>

                                <p className="mt-1 truncate text-xs text-zinc-500">
                                  {
                                    user.email
                                  }
                                </p>
                              </div>
                            </div>

                            <div>
                              <span
                                className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${roleStyle(
                                  user.role,
                                )}`}
                              >
                                {
                                  user.role
                                }
                              </span>
                            </div>

                            <div>
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${
                                  user.status ===
                                  "ACTIVE"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-red-50 text-red-700"
                                }`}
                              >
                                {user.status ===
                                "ACTIVE" ? (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                ) : (
                                  <Ban className="h-3.5 w-3.5" />
                                )}

                                {
                                  user.status
                                }
                              </span>
                            </div>

                            <p className="text-sm text-zinc-500">
                              {user.createdAt.toLocaleDateString()}
                            </p>

                            <div className="flex justify-end">
                              {isAdmin ? (
                                <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                                  <ShieldCheck className="h-4 w-4" />

                                  Protected admin
                                </span>
                              ) : (
                                <form
                                  action={
                                    action
                                  }
                                >
                                  <button
                                    type="submit"
                                    className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                                      user.status ===
                                      "ACTIVE"
                                        ? "border-red-200 text-red-600 hover:bg-red-50"
                                        : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                    }`}
                                  >
                                    {user.status ===
                                    "ACTIVE"
                                      ? "Suspend"
                                      : "Reactivate"}
                                  </button>
                                </form>
                              )}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>

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
                    {totalUsers}
                  </b>
                </p>

                <div className="flex gap-2">
                  {safePage >
                  1 ? (
                    <Link
                      href={createHref({
                        q,
                        role,
                        status,
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
                        role,
                        status,
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

function UsersLoading() {
  return (
    <div className="p-10">
      <div className="h-[550px] animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

export default function UsersPage({
  searchParams,
}: UsersPageProps) {
  return (
    <Suspense
      fallback={
        <UsersLoading />
      }
    >
      <UsersContent
        searchParams={
          searchParams
        }
      />
    </Suspense>
  );
}