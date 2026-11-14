"use client";

import {
  Activity,
  AlertTriangle,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  ShieldCheck,
  Store,
  Users,
  X,
} from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { logoutAction } from "@/app/login/actions";

type AdminSidebarProps = {
  admin: {
    name: string;
    email: string;
  };

  pendingListings: number;
  openDamageReports: number;
};

const navigation = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Listings",
    href: "/admin/listings",
    icon: Store,
  },
  {
    label: "Rentals",
    href: "/admin/rentals",
    icon: ClipboardList,
  },
  {
    label: "Transactions",
    href: "/admin/transactions",
    icon: ReceiptText,
  },
  {
    label: "Damage Reports",
    href: "/admin/damage-reports",
    icon: AlertTriangle,
  },
  {
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: Activity,
  },
];

function getInitials(
  name?: string | null,
) {
  if (!name) {
    return "AD";
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "AD";
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${
    parts[parts.length - 1][0]
  }`.toUpperCase();
}

export default function AdminSidebar({
  admin,
  pendingListings = 0,
  openDamageReports = 0,
}: AdminSidebarProps) {
  const pathname =
    usePathname();

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  function isActive(
    href: string,
  ) {
    if (
      href ===
      "/admin/dashboard"
    ) {
      return pathname === href;
    }

    return pathname.startsWith(
      href,
    );
  }

  function badgeForRoute(
    href: string,
  ) {
    if (
      href ===
      "/admin/listings"
    ) {
      return pendingListings;
    }

    if (
      href ===
      "/admin/damage-reports"
    ) {
      return openDamageReports;
    }

    return 0;
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* BRAND */}
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
        <Link
          href="/admin/dashboard"
          onClick={() =>
            setMobileOpen(false)
          }
          className="flex items-center gap-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>

          <div>
            <p className="text-lg font-bold tracking-tight text-white">
              GoGoRent
            </p>

            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Administration
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() =>
            setMobileOpen(false)
          }
          aria-label="Close admin menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* SECTION LABEL */}
      <div className="px-5 pb-2 pt-6">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Platform management
        </p>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {navigation.map(
          (item) => {
            const Icon =
              item.icon;

            const active =
              isActive(
                item.href,
              );

            const badge =
              badgeForRoute(
                item.href,
              );

            return (
              <Link
                key={
                  item.href
                }
                href={
                  item.href
                }
                onClick={() =>
                  setMobileOpen(
                    false,
                  )
                }
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-white text-zinc-950"
                    : "text-zinc-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />

                <span className="flex-1">
                  {
                    item.label
                  }
                </span>

                {badge >
                  0 && (
                  <span
                    className={`flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      active
                        ? "bg-zinc-950 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {badge > 99
                      ? "99+"
                      : badge}
                  </span>
                )}
              </Link>
            );
          },
        )}
      </nav>

      {/* BOTTOM */}
      <div className="border-t border-white/10 p-4">
        <Link
          href="/"
          onClick={() =>
            setMobileOpen(false)
          }
          className="mb-3 flex items-center gap-3 rounded-lg border border-white/10 px-3 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
        >
          <Store className="h-[18px] w-[18px]" />

          View marketplace
        </Link>

        {/* ADMIN ACCOUNT */}
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {getInitials(
              admin.name,
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {admin.name ||
                "Administrator"}
            </p>

            <p className="mt-0.5 truncate text-xs text-zinc-500">
              {admin.email}
            </p>
          </div>
        </div>

        <form
          action={
            logoutAction
          }
          className="mt-3"
        >
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-[18px] w-[18px]" />

            Log out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* MOBILE HEADER */}
      <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-5 lg:hidden">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2"
        >
          <ShieldCheck className="h-5 w-5 text-red-500" />

          <span className="font-bold text-zinc-950">
            GoGoRent Admin
          </span>
        </Link>

        <button
          type="button"
          onClick={() =>
            setMobileOpen(true)
          }
          aria-label="Open admin menu"
          className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white"
        >
          <Menu className="h-5 w-5" />

          {(pendingListings >
            0 ||
            openDamageReports >
              0) && (
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </button>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-[#111214] lg:block">
        {
          sidebarContent
        }
      </aside>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close admin menu"
            onClick={() =>
              setMobileOpen(false)
            }
            className="absolute inset-0 bg-black/50"
          />

          <aside className="relative h-full w-[290px] max-w-[85vw] bg-[#111214] shadow-2xl">
            {
              sidebarContent
            }
          </aside>
        </div>
      )}
    </>
  );
}