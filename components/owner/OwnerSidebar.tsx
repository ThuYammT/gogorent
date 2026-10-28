"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Bell,
  CalendarRange,
  ChevronRight,
  ExternalLink,
  Inbox,
  LayoutDashboard,
  LogOut,
  Package,
  UserRound,
  WalletCards,
} from "lucide-react";

import Logo from "@/components/layout/Logo";

import { logoutAction } from "@/actions/session";

type OwnerSidebarProps = {
  name: string;
  email: string;
};

const links = [
  {
    label: "Overview",
    href: "/owner/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Devices",
    href: "/owner/devices",
    icon: Package,
  },
  {
    label: "Requests",
    href: "/owner/requests",
    icon: Inbox,
  },
  {
    label: "Rentals",
    href: "/owner/rentals",
    icon: CalendarRange,
  },
  {
    label: "Earnings",
    href: "/owner/earnings",
    icon: WalletCards,
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

export default function OwnerSidebar({
  name,
  email,
}: OwnerSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-[272px] shrink-0 flex-col border-r border-zinc-800 bg-[#111214] px-4 py-5 text-white">
      {/* LOGO */}
      <div className="px-2">
        <div className="rounded-xl bg-white px-3 py-3">
          <Logo />
        </div>
      </div>

      {/* WORKSPACE LABEL */}
      <div className="mt-8 px-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Owner workspace
        </p>
      </div>

      {/* NAVIGATION */}
      <nav className="mt-3 space-y-1">
        {links.map((item) => {
          const active =
            pathname === item.href ||
            pathname.startsWith(
              `${item.href}/`,
            );

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-white text-zinc-950"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />

              <span className="flex-1">
                {item.label}
              </span>

              {active && (
                <ChevronRight className="h-4 w-4 text-zinc-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* BOTTOM */}
      <div className="mt-auto">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
        >
          <ExternalLink className="h-[18px] w-[18px]" />

          View marketplace
        </Link>

        <form action={logoutAction}>
          <button
            type="submit"
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-red-950/40 hover:text-red-400"
          >
            <LogOut className="h-[18px] w-[18px]" />

            Log out
          </button>
        </form>

        {/* ACCOUNT */}
        <div className="mt-4 border-t border-zinc-800 pt-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-semibold text-zinc-950">
              {name
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {name}
              </p>

              <p className="truncate text-xs text-zinc-500">
                {email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}