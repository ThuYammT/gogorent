import { Suspense } from "react";
import Link from "next/link";

import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldCheck,
} from "lucide-react";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 10;

type AuditLogsPageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
};

function formatAction(
  action: string,
) {
  return action
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function createHref({
  q,
  page,
}: {
  q: string;
  page: number;
}) {
  const params =
    new URLSearchParams();

  if (q) {
    params.set("q", q);
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
    ? `/admin/audit-logs?${query}`
    : "/admin/audit-logs";
}

async function AuditLogsContent({
  searchParams,
}: AuditLogsPageProps) {
  await requireAdmin();

  const params =
    await searchParams;

  const q =
    params.q?.trim() ?? "";

  const rawPage =
    Number(
      params.page ?? "1",
    );

  const page =
    Number.isFinite(rawPage) &&
    rawPage > 0
      ? Math.floor(rawPage)
      : 1;

  const where = q
    ? {
        OR: [
          {
            action: {
              contains: q,
              mode:
                "insensitive" as const,
            },
          },

          {
            user: {
              name: {
                contains: q,
                mode:
                  "insensitive" as const,
              },
            },
          },

          {
            user: {
              email: {
                contains: q,
                mode:
                  "insensitive" as const,
              },
            },
          },
        ],
      }
    : {};

  const total =
    await prisma.auditLog.count({
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

  const logs =
    await prisma.auditLog.findMany({
      where,

      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
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
            Security & activity
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
            Audit Logs
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Review recorded administrative and platform activity.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-6 py-8 md:px-10 xl:px-12">
        {/* INFO */}
        <section className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
            <ShieldCheck className="h-5 w-5 text-zinc-600" />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-950">
              Read-only system record
            </h2>

            <p className="mt-1 text-sm leading-6 text-zinc-500">
              Audit records are maintained for accountability and should not be modified from the administration dashboard.
            </p>
          </div>
        </section>

        {/* SEARCH */}
        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
          <form className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

            <input
              name="q"
              defaultValue={q}
              placeholder="Search action or user..."
              className="w-full rounded-lg border border-zinc-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-zinc-400"
            />
          </form>
        </section>

        {/* LOG TABLE */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          {logs.length ===
          0 ? (
            <div className="px-6 py-20 text-center">
              <Activity className="mx-auto h-9 w-9 text-zinc-300" />

              <h2 className="mt-4 font-semibold text-zinc-900">
                No audit logs found
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Recorded platform activity will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                  <div className="grid grid-cols-[1.5fr_2fr_1fr_1.2fr] border-b border-zinc-100 bg-zinc-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    <span>
                      User
                    </span>

                    <span>
                      Action
                    </span>

                    <span>
                      Role
                    </span>

                    <span className="text-right">
                      Date & time
                    </span>
                  </div>

                  <div className="divide-y divide-zinc-100">
                    {logs.map(
                      (log) => (
                        <div
                          key={
                            log.id
                          }
                          className="grid grid-cols-[1.5fr_2fr_1fr_1.2fr] items-center px-6 py-5"
                        >
                          {/* USER */}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-zinc-950">
                              {
                                log.user
                                  .name
                              }
                            </p>

                            <p className="mt-1 truncate text-xs text-zinc-400">
                              {
                                log.user
                                  .email
                              }
                            </p>
                          </div>

                          {/* ACTION */}
                          <div>
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4 shrink-0 text-zinc-400" />

                              <p className="text-sm font-medium text-zinc-700">
                                {formatAction(
                                  log.action,
                                )}
                              </p>
                            </div>

                            <p className="mt-1 text-xs text-zinc-400">
                              Log #
                              {log.id.slice(
                                -8,
                              )}
                            </p>
                          </div>

                          {/* ROLE */}
                          <div>
                            <span
                              className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${
                                log.user
                                  .role ===
                                "ADMIN"
                                  ? "bg-red-50 text-red-700"
                                  : log.user
                                        .role ===
                                      "OWNER"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              {
                                log.user
                                  .role
                              }
                            </span>
                          </div>

                          {/* TIME */}
                          <div className="text-right">
                            <p className="text-sm text-zinc-600">
                              {log.createdAt.toLocaleDateString()}
                            </p>

                            <p className="mt-1 text-xs text-zinc-400">
                              {log.createdAt.toLocaleTimeString(
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
                      ),
                    )}
                  </div>
                </div>
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

function AuditLogsLoading() {
  return (
    <div className="p-10">
      <div className="h-[550px] animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

export default function AdminAuditLogsPage({
  searchParams,
}: AuditLogsPageProps) {
  return (
    <Suspense
      fallback={
        <AuditLogsLoading />
      }
    >
      <AuditLogsContent
        searchParams={
          searchParams
        }
      />
    </Suspense>
  );
}