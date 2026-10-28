import { Suspense } from "react";
import {
  Bell,
  Check,
} from "lucide-react";

import {
  markAllNotificationsRead,
  markNotificationRead,
} from "./actions";

import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";

async function NotificationsContent() {
  const owner = await requireOwner();

  const notifications =
    await prisma.notification.findMany({
      where: {
        userId: owner.id,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.isRead,
    ).length;

  return (
    <>
      <header className="border-b border-zinc-200 bg-white px-6 py-8 md:px-10 xl:px-12">
        <div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Account activity
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
              Notifications
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
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
                markAllNotificationsRead
              }
            >
              <button
                type="submit"
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                Mark all as read
              </button>
            </form>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-6 py-8 md:px-10 xl:px-12">
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100">
              <Bell className="h-6 w-6 text-zinc-400" />
            </div>

            <h2 className="mt-4 font-semibold text-zinc-800">
              No notifications
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Listing, rental, and payment
              updates will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <div className="divide-y divide-zinc-100">
              {notifications.map(
                (notification) => {
                  const markReadAction =
                    markNotificationRead.bind(
                      null,
                      notification.id,
                    );

                  return (
                    <article
                      key={
                        notification.id
                      }
                      className={`flex gap-4 px-6 py-5 ${
                        notification.isRead
                          ? "bg-white"
                          : "bg-amber-50/40"
                      }`}
                    >
                      <div className="pt-2">
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${
                            notification.isRead
                              ? "bg-zinc-200"
                              : "bg-amber-500"
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h2 className="text-sm font-semibold text-zinc-900">
                            {
                              notification.title
                            }
                          </h2>

                          <span className="text-xs text-zinc-400">
                            {notification.createdAt.toLocaleString()}
                          </span>
                        </div>

                        <p className="mt-1 text-sm leading-6 text-zinc-500">
                          {
                            notification.message
                          }
                        </p>
                      </div>

                      {!notification.isRead && (
                        <form
                          action={
                            markReadAction
                          }
                        >
                          <button
                            type="submit"
                            title="Mark as read"
                            className="rounded-lg border border-zinc-200 bg-white p-2 text-zinc-500 transition hover:bg-zinc-50"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </form>
                      )}
                    </article>
                  );
                },
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function NotificationsLoading() {
  return (
    <div className="px-6 py-8 md:px-10 xl:px-12">
      <div className="mx-auto max-w-[1400px]">
        <div className="h-28 animate-pulse rounded-2xl bg-white" />

        <div className="mt-6 h-72 animate-pulse rounded-2xl bg-white" />
      </div>
    </div>
  );
}

export default function OwnerNotificationsPage() {
  return (
    <Suspense
      fallback={
        <NotificationsLoading />
      }
    >
      <NotificationsContent />
    </Suspense>
  );
}