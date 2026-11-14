import Link from "next/link";
import { Suspense } from "react";
import { Bell, Clock3 } from "lucide-react";

import {
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "./actions";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

async function AdminNotificationsContent() {
  const admin = await requireAdmin();
  const notifications = await prisma.notification.findMany({
    where: { userId: admin.id },
    orderBy: { createdAt: "desc" },
  });
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <>
      <header className="border-b border-zinc-200 bg-white px-6 py-8 md:px-10 xl:px-12">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-500">Administration</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
              Notifications
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Listing submissions and other platform updates.
            </p>
          </div>
          {unreadCount > 0 && (
            <form action={markAllAdminNotificationsRead}>
              <button
                type="submit"
                className="rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Mark all as read ({unreadCount})
              </button>
            </form>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-6 py-8 md:px-10 xl:px-12">
        <section className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          {notifications.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <Bell className="mx-auto h-9 w-9 text-zinc-300" />
              <h2 className="mt-4 font-semibold text-zinc-900">
                No notifications yet
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                New listing submissions will appear here.
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <article
                key={notification.id}
                className={`flex gap-4 px-6 py-5 ${
                  notification.isRead ? "bg-white" : "bg-red-50/40"
                }`}
              >
                <span
                  className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                    notification.isRead ? "bg-zinc-200" : "bg-red-500"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    {notification.deviceId ? (
                      <Link
                        href={`/admin/listings/${notification.deviceId}`}
                        className="text-sm font-semibold text-zinc-950 hover:underline"
                      >
                        {notification.title}
                      </Link>
                    ) : (
                      <p className="text-sm font-semibold text-zinc-950">
                        {notification.title}
                      </p>
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
                      action={markAdminNotificationRead.bind(null, notification.id)}
                      className="mt-3"
                    >
                      <button
                        type="submit"
                        className="text-xs font-semibold text-zinc-600 hover:text-zinc-950"
                      >
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
    </>
  );
}

export default function AdminNotificationsPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-sm text-zinc-500">Loading notifications...</div>}
    >
      <AdminNotificationsContent />
    </Suspense>
  );
}
