import { Suspense } from "react";
import Link from "next/link";

import {
  Bell,
  BellRing,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import {
  markAllNotificationsRead,
  markNotificationRead,
} from "./actions";

import { NotificationActionButton } from "@/components/owner/NotificationActions";

import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";

type NotificationsPageProps = {
  searchParams: Promise<{
    filter?: string;
  }>;
};

/* ======================================================
   TIME DISPLAY
====================================================== */

function formatNotificationTime(
  date: Date,
) {
  const now =
    Date.now();

  const difference =
    Math.max(
      0,
      now -
        date.getTime(),
    );

  const minutes =
    Math.floor(
      difference /
        60_000,
    );

  const hours =
    Math.floor(
      difference /
        3_600_000,
    );

  const days =
    Math.floor(
      difference /
        86_400_000,
    );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min${
      minutes === 1
        ? ""
        : "s"
    } ago`;
  }

  if (hours < 24) {
    return `${hours} hour${
      hours === 1
        ? ""
        : "s"
    } ago`;
  }

  if (days === 1) {
    return "Yesterday";
  }

  if (days < 7) {
    return `${days} days ago`;
  }

  return date.toLocaleDateString();
}

/* ======================================================
   CONTENT
====================================================== */

async function NotificationsContent({
  searchParams,
}: NotificationsPageProps) {
  const owner =
    await requireOwner();

  const params =
    await searchParams;

  const filter =
    params.filter ===
    "unread"
      ? "unread"
      : "all";

  const [
    notifications,
    unreadCount,
    totalCount,
  ] =
    await Promise.all([
      prisma.notification.findMany({
        where: {
          userId:
            owner.id,

          ...(filter ===
          "unread"
            ? {
                isRead:
                  false,
              }
            : {}),
        },

        orderBy: {
          createdAt:
            "desc",
        },
      }),

      prisma.notification.count({
        where: {
          userId:
            owner.id,

          isRead:
            false,
        },
      }),

      prisma.notification.count({
        where: {
          userId:
            owner.id,
        },
      }),
    ]);

  return (
    <>
      {/* HEADER */}
      <header className="border-b border-zinc-200 bg-white px-6 py-8 md:px-10 xl:px-12">
        <div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Owner workspace
            </p>

            <div className="mt-1 flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
                Notifications
              </h1>

              {unreadCount >
                0 && (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                  {
                    unreadCount
                  }{" "}
                  unread
                </span>
              )}
            </div>

            <p className="mt-2 text-sm text-zinc-500">
              Keep track of listing updates,
              rental activity and account
              notifications.
            </p>
          </div>

          {unreadCount >
            0 && (
            <form
              action={
                markAllNotificationsRead
              }
            >
              <NotificationActionButton variant="all" />
            </form>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-6 py-8 md:px-10 xl:px-12">
        {/* SUMMARY */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Total notifications
                </p>

                <p className="mt-2 text-2xl font-semibold text-zinc-950">
                  {
                    totalCount
                  }
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
                <Bell className="h-5 w-5 text-zinc-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Unread
                </p>

                <p className="mt-2 text-2xl font-semibold text-zinc-950">
                  {
                    unreadCount
                  }
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <BellRing className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </div>
        </section>

        {/* FILTER */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="flex items-center gap-1 border-b border-zinc-100 px-5 py-3">
            <Link
              href="/owner/notifications"
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter ===
                "all"
                  ? "bg-zinc-950 text-white"
                  : "text-zinc-500 hover:bg-zinc-100"
              }`}
            >
              All
              <span className="ml-2 text-xs opacity-70">
                {
                  totalCount
                }
              </span>
            </Link>

            <Link
              href="/owner/notifications?filter=unread"
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter ===
                "unread"
                  ? "bg-zinc-950 text-white"
                  : "text-zinc-500 hover:bg-zinc-100"
              }`}
            >
              Unread

              <span className="ml-2 text-xs opacity-70">
                {
                  unreadCount
                }
              </span>
            </Link>
          </div>

          {/* EMPTY */}
          {notifications.length ===
          0 ? (
            <div className="px-6 py-20 text-center">
              {filter ===
              "unread" ? (
                <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-400" />
              ) : (
                <Bell className="mx-auto h-9 w-9 text-zinc-300" />
              )}

              <h2 className="mt-4 font-semibold text-zinc-900">
                {filter ===
                "unread"
                  ? "You're all caught up"
                  : "No notifications yet"}
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                {filter ===
                "unread"
                  ? "There are no unread notifications."
                  : "Updates about your listings and rentals will appear here."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {notifications.map(
                (
                  notification,
                ) => {
                  const readAction =
                    markNotificationRead.bind(
                      null,
                      notification.id,
                    );
                  const bookingHref =
                    notification.rentalId
                      ? notification.type ===
                        "BOOKING_REQUESTED"
                        ? `/owner/requests#${notification.rentalId}`
                        : `/owner/rentals?status=CANCELLED#${notification.rentalId}`
                      : null;

                  return (
                    <div
                      key={
                        notification.id
                      }
                      className={`relative flex gap-4 px-6 py-5 transition ${
                        notification.isRead
                          ? "bg-white"
                          : "bg-amber-50/40"
                      }`}
                    >
                      {/* UNREAD DOT */}
                      <div className="pt-1.5">
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${
                            notification.isRead
                              ? "bg-zinc-200"
                              : "bg-amber-500"
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                          <div>
                            {bookingHref ? (
                              <Link
                                href={bookingHref}
                                className={`text-sm hover:underline ${
                                  notification.isRead
                                    ? "font-medium text-zinc-800"
                                    : "font-semibold text-zinc-950"
                                }`}
                              >
                                {notification.title}
                              </Link>
                            ) : (
                              <p
                                className={`text-sm ${
                                  notification.isRead
                                    ? "font-medium text-zinc-800"
                                    : "font-semibold text-zinc-950"
                                }`}
                              >
                                {notification.title}
                              </p>
                            )}

                            <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-500">
                              {
                                notification.message
                              }
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5 text-xs text-zinc-400">
                            <Clock3 className="h-3.5 w-3.5" />

                            {formatNotificationTime(
                              notification.createdAt,
                            )}
                          </div>
                        </div>

                        {!notification.isRead && (
                          <div className="mt-3">
                            <form
                              action={
                                readAction
                              }
                            >
                              <NotificationActionButton variant="single" />
                            </form>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

/* ======================================================
   LOADING
====================================================== */

function NotificationsLoading() {
  return (
    <div className="p-8 md:p-10">
      <div className="h-24 animate-pulse rounded-2xl bg-white" />

      <div className="mt-6 h-[420px] animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

export default function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  return (
    <Suspense
      fallback={
        <NotificationsLoading />
      }
    >
      <NotificationsContent
        searchParams={
          searchParams
        }
      />
    </Suspense>
  );
}