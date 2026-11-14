import Link from "next/link";
import { Suspense } from "react";

import { Bell, Check, Clock3 } from "lucide-react";

import {
  markAllRenterNotificationsRead,
  markRenterNotificationRead,
} from "./actions";

import { prisma } from "@/lib/prisma";
import { requireRenter } from "@/lib/session";

async function RenterNotificationsContent() {
  const renter = await requireRenter();

  const [notifications, unreadCount] = await Promise.all([
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
    <main className="min-h-screen bg-[#fafafa] p-6 md:p-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-orange-500">RENTER WORKSPACE</p>
            <h1 className="mt-1 text-3xl font-black text-zinc-950">
              Notifications
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Booking decisions and updates from your rentals.
            </p>
          </div>
          <Link
            href="/renter/rentals"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700"
          >
            Your bookings
          </Link>
        </div>

        {unreadCount > 0 && (
          <form action={markAllRenterNotificationsRead} className="mt-5">
            <button
              type="submit"
              className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Mark all as read
            </button>
          </form>
        )}

        <section className="mt-6 divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          {notifications.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Bell className="mx-auto h-9 w-9 text-zinc-300" />
              <h2 className="mt-4 font-semibold text-zinc-900">
                No notifications yet
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                Updates about your booking requests will appear here.
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <article
                key={notification.id}
                className={`flex gap-4 p-5 ${
                  notification.isRead ? "bg-white" : "bg-amber-50/40"
                }`}
              >
                <div className="pt-1.5">
                  <span
                    className={`block h-2.5 w-2.5 rounded-full ${
                      notification.isRead ? "bg-zinc-200" : "bg-amber-500"
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    {notification.rentalId ? (
                      <Link
                        href={`/renter/rentals/${notification.rentalId}`}
                        className="text-sm font-semibold text-zinc-900 hover:underline"
                      >
                        {notification.title}
                      </Link>
                    ) : (
                      <h2 className="text-sm font-semibold text-zinc-900">
                        {notification.title}
                      </h2>
                    )}
                    <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Clock3 className="h-3.5 w-3.5" />
                      {notification.createdAt.toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    {notification.message}
                  </p>
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
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Mark as read
                      </button>
                    </form>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}

export default function RenterNotificationsPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-sm text-zinc-500">Loading notifications...</div>}
    >
      <RenterNotificationsContent />
    </Suspense>
  );
}