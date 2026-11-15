"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Bell,
  CalendarDays,
  Heart,
  LayoutDashboard,
  LogOut,
  Search,
  UserRound,
} from "lucide-react";

import { logoutAction } from "@/app/login/actions";

type RenterSidebarProps = {
  renter: {
    name: string;
    email: string;
  };
  unreadCount: number;
};

const navItems = [
  {
    label: "Overview",
    href: "/renter/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Browse devices",
    href: "/devices",
    icon: Search,
  },
  {
    label: "My bookings",
    href: "/renter/rentals",
    icon: CalendarDays,
  },
  {
    label: "Saved devices",
    href: "/renter/favorites",
    icon: Heart,
  },
  {
    label: "Notifications",
    href: "/renter/notifications",
    icon: Bell,
  },
  {
    label: "Profile",
    href: "/renter/profile",
    icon: UserRound,
  },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "R";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}

export default function RenterSidebar({
  renter,
  unreadCount,
}: RenterSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/devices") {
      return pathname === "/devices" || pathname.startsWith("/devices/");
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-white/10 bg-[#111214] lg:flex">
        <div className="flex h-20 items-center border-b border-white/10 px-7">
          <Link
            href="/renter/dashboard"
            className="text-xl font-extrabold tracking-tight text-white"
          >
            GoGo
            <span className="text-amber-400">
              Rent
            </span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Renter workspace
          </p>

          <nav className="mt-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-white text-zinc-950 shadow-sm"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />

                  <span className="flex-1">
                    {item.label}
                  </span>

                  {item.href ===
                    "/renter/notifications" &&
                    unreadCount > 0 && (
                      <span className="flex min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-zinc-950">
                        {unreadCount > 99
                          ? "99+"
                          : unreadCount}
                      </span>
                    )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-2xl bg-white/[0.06] p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-zinc-950">
                {initials(renter.name)}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {renter.name}
                </p>

                <p className="truncate text-xs text-zinc-500">
                  {renter.email}
                </p>
              </div>
            </div>
          </div>

          <form
            action={logoutAction}
            className="mt-2"
          >
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-[18px] w-[18px]" />
              Log out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white lg:hidden">
        <div className="flex h-16 items-center justify-between px-5">
          <Link
            href="/renter/dashboard"
            className="text-lg font-extrabold text-zinc-950"
          >
            GoGo
            <span className="text-amber-500">
              Rent
            </span>
          </Link>

          <Link
            href="/renter/notifications"
            className="relative rounded-xl border border-zinc-200 p-2.5 text-zinc-600"
          >
            <Bell className="h-5 w-5" />

            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-zinc-950">
                {unreadCount > 9
                  ? "9+"
                  : unreadCount}
              </span>
            )}
          </Link>
        </div>

        <div className="overflow-x-auto border-t border-zinc-100 px-3">
          <nav className="flex min-w-max gap-1 py-2">
            {navItems
              .filter(
                (item) =>
                  item.href !==
                  "/renter/notifications",
              )
              .map((item) => {
                const Icon = item.icon;
                const active = isActive(
                  item.href,
                );

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                      active
                        ? "bg-zinc-950 text-white"
                        : "text-zinc-500"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
          </nav>
        </div>
      </header>
    </>
  );
}