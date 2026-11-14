"use client";

import {
  Bell,
  CircleDollarSign,
  ClipboardList,
  Home,
  LogOut,
  Menu,
  Package,
  Store,
  UserRound,
  X,
} from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { logoutAction } from "@/app/login/actions";

type OwnerSidebarProps = {
  owner: {
    name: string;
    email: string;
  };

  unreadNotifications: number;
};

const navigation = [
  {
    label: "Overview",
    href: "/owner/dashboard",
    icon: Home,
  },
  {
    label: "My Devices",
    href: "/owner/devices",
    icon: Package,
  },
  {
    label: "Requests",
    href: "/owner/requests",
    icon: ClipboardList,
  },
  {
    label: "Rentals",
    href: "/owner/rentals",
    icon: Store,
  },
  {
    label: "Earnings",
    href: "/owner/earnings",
    icon: CircleDollarSign,
  },
  {
    label: "Notifications",
    href: "/owner/notifications",
    icon: Bell,
  },
  {
    label: "Profile",
    href: "/owner/profile",
    icon: UserRound,
  },
];

function getInitials(
  name?: string | null,
) {
  if (!name) {
    return "O";
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "O";
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

export default function OwnerSidebar({
  owner,
  unreadNotifications = 0,
}: OwnerSidebarProps) {
  const pathname =
    usePathname();

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const ownerName =
    owner?.name?.trim() ||
    "Owner";

  const ownerEmail =
    owner?.email?.trim() ||
    "";

  function isActive(
    href: string,
  ) {
    if (
      href ===
      "/owner/dashboard"
    ) {
      return (
        pathname ===
        href
      );
    }

    return pathname.startsWith(
      href,
    );
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* BRAND */}
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
        <Link
          href="/owner/dashboard"
          onClick={() =>
            setMobileOpen(false)
          }
          className="text-xl font-bold tracking-tight text-white"
        >
          GoGo
          <span className="text-amber-400">
            Rent
          </span>
        </Link>

        <button
          type="button"
          onClick={() =>
            setMobileOpen(false)
          }
          aria-label="Close owner menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* LABEL */}
      <div className="px-5 pb-2 pt-6">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Owner workspace
        </p>
      </div>

      {/* NAV */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {navigation.map(
          (item) => {
            const Icon =
              item.icon;

            const active =
              isActive(
                item.href,
              );

            const isNotifications =
              item.href ===
              "/owner/notifications";

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

                {isNotifications &&
                  unreadNotifications >
                    0 && (
                    <span
                      className={`flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        active
                          ? "bg-zinc-950 text-white"
                          : "bg-amber-400 text-zinc-950"
                      }`}
                    >
                      {unreadNotifications >
                      99
                        ? "99+"
                        : unreadNotifications}
                    </span>
                  )}
              </Link>
            );
          },
        )}
      </nav>

      {/* BOTTOM */}
      <div className="border-t border-white/10 p-4">
        {/* MARKETPLACE */}
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

        {/* OWNER PROFILE */}
        <Link
          href="/owner/profile"
          onClick={() =>
            setMobileOpen(false)
          }
          className="flex items-center gap-3 rounded-xl bg-white/5 p-3 transition hover:bg-white/10"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-zinc-950">
            {getInitials(
              ownerName,
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {
                ownerName
              }
            </p>

            {ownerEmail && (
              <p className="mt-0.5 truncate text-xs text-zinc-500">
                {
                  ownerEmail
                }
              </p>
            )}
          </div>
        </Link>

        {/* LOGOUT */}
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
      {/* MOBILE TOP BAR */}
      <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-5 lg:hidden">
        <Link
          href="/owner/dashboard"
          className="text-lg font-bold text-zinc-950"
        >
          GoGo
          <span className="text-amber-500">
            Rent
          </span>
        </Link>

        <button
          type="button"
          onClick={() =>
            setMobileOpen(true)
          }
          aria-label="Open owner menu"
          className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white"
        >
          <Menu className="h-5 w-5" />

          {unreadNotifications >
            0 && (
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
          )}
        </button>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-[#111214] lg:block">
        {
          sidebarContent
        }
      </aside>

      {/* MOBILE SIDEBAR */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close owner menu"
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