import Link from "next/link";
import { Suspense } from "react";

import {
  Bell,
  Check,
  CheckCheck,
  Clock3,
} from "lucide-react";

import {
  markAllRenterNotificationsRead,
  markRenterNotificationRead,
} from "./actions";

import { prisma } from "@/lib/prisma";
import { requireRenter } from "@/lib/session";

async function RenterNotificationsContent() {
  const renter =
    await requireRenter();

  const [
    notifications,
    unreadCount,
  ] = await Promise.all([
    prisma.notification.findMany({
      where: {
        userId: renter.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.notification.count({
      where: {
        userId: renter.id,
        isRead: false,
      },
    }),
  ]);

  return (
    <main className="p-5 md:p-8 lg:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-amber-600">
              Renter workspace
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
              Notifications
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Booking decisions,
              collection updates and
              rental activity.
            </p>
          </div>

          <Link
            href="/renter/rentals"
            className="w-fit rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
          >
            View bookings
          </Link>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900">
              Inbox
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              {unreadCount === 0
                ? "You're all caught up."
                : `${unreadCount} unread notification${
                    unreadCount === 1
                      ? ""
                      : "s"
                  }`}
            </p>
          </div>

          {unreadCount > 0 && (
            <form
              action={
                markAllRenterNotificationsRead
              }
            >
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </button>
            </form>
          )}
        </div>

        <section className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          {notifications.length ===
          0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100">
                <Bell className="h-6 w-6 text-zinc-400" />
              </div>

              <h2 className="mt-4 font-semibold text-zinc-900">
                No notifications yet
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Booking and rental
                updates will appear
                here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {notifications.map(
                (notification) => (
                  <article
                    key={
                      notification.id
                    }
                    className={`flex gap-4 p-5 ${
                      notification.isRead
                        ? "bg-white"
                        : "bg-amber-50/50"
                    }`}
                  >
                    <div className="pt-1">
                      <span
                        className={`block h-2.5 w-2.5 rounded-full ${
                          notification.isRead
                            ? "bg-zinc-200"
                            : "bg-amber-500"
                        }`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                        <div>
                          {notification.rentalId ? (
                            <Link
                              href={`/renter/rentals/${notification.rentalId}`}
                              className="text-sm font-semibold text-zinc-900 hover:text-amber-700"
                            >
                              {
                                notification.title
                              }
                            </Link>
                          ) : (
                            <h2 className="text-sm font-semibold text-zinc-900">
                              {
                                notification.title
                              }
                            </h2>
                          )}

                          <p className="mt-1 text-sm leading-6 text-zinc-600">
                            {
                              notification.message
                            }
                          </p>
                        </div>

                        <span className="flex shrink-0 items-center gap-1.5 text-xs text-zinc-400">
                          <Clock3 className="h-3.5 w-3.5" />

                          {notification.createdAt.toLocaleString()}
                        </span>
                      </div>

                      {!notification.isRead && (
                        <form
                          action={markRenterNotificationRead.bind(
                            null,
                            notification.id,
                          )}
                          className="mt-3"
                        >
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-950"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Mark as read
                          </button>
                        </form>
                      )}
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function RenterNotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-zinc-500">
          Loading notifications...
        </div>
      }
    >
      <RenterNotificationsContent />
    </Suspense>
  );
}