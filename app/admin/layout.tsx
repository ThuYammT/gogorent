import {
  Suspense,
  type ReactNode,
} from "react";

import AdminSidebar from "@/components/admin/AdminSidebar";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

/* ======================================================
   ADMIN SHELL
====================================================== */

async function AdminShell({
  children,
}: {
  children: ReactNode;
}) {
  const admin =
    await requireAdmin();

  const [
    pendingListings,
    openDamageReports,
    unreadNotifications,
  ] =
    await Promise.all([
      prisma.device.count({
        where: {
          status:
            "PENDING_APPROVAL",
        },
      }),

      prisma.damageReport.count({
        where: {
          status: {
            in: [
              "OPEN",
              "UNDER_REVIEW",
            ],
          },
        },
      }),

      prisma.notification.count({
        where: {
          userId: admin.id,
          isRead: false,
        },
      }),
    ]);

  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      <AdminSidebar
        admin={{
          name:
            admin.name ??
            "Administrator",

          email:
            admin.email ??
            "",
        }}
        pendingListings={
          pendingListings
        }
        openDamageReports={
          openDamageReports
        }
        unreadNotifications={
          unreadNotifications
        }
      />

      <main className="min-h-screen lg:pl-64">
        {
          children
        }
      </main>
    </div>
  );
}

/* ======================================================
   FALLBACK
====================================================== */

function AdminLayoutLoading({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      {/* DESKTOP SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-[#111214] lg:block">
        <div className="h-20 border-b border-white/10 px-6 py-6">
          <div className="h-6 w-32 animate-pulse rounded bg-white/10" />
        </div>

        <div className="space-y-3 p-5">
          <div className="h-4 w-32 animate-pulse rounded bg-white/10" />

          {[1, 2, 3, 4, 5, 6, 7].map(
            (item) => (
              <div
                key={item}
                className="h-10 animate-pulse rounded-lg bg-white/5"
              />
            ),
          )}
        </div>
      </aside>

      {/* MOBILE */}
      <div className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-5 lg:hidden">
        <div className="h-6 w-32 animate-pulse rounded bg-zinc-100" />

        <div className="h-10 w-10 animate-pulse rounded-lg bg-zinc-100" />
      </div>

      <main className="min-h-screen lg:pl-64">
        {
          children
        }
      </main>
    </div>
  );
}

/* ======================================================
   LAYOUT
====================================================== */

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <AdminLayoutLoading>
          {children}
        </AdminLayoutLoading>
      }
    >
      <AdminShell>
        {children}
      </AdminShell>
    </Suspense>
  );
}