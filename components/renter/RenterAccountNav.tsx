"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Bell,
  Heart,
  LayoutDashboard,
  ShoppingBag,
  UserRound,
} from "lucide-react";

const items = [
  {
    label: "Overview",
    href: "/renter/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My bookings",
    href: "/renter/rentals",
    icon: ShoppingBag,
  },
  {
    label: "Saved",
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

export default function RenterAccountNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-zinc-200 bg-white">
      <div className="mx-auto max-w-7xl overflow-x-auto px-5 lg:px-6">
        <nav className="flex min-w-max gap-1 py-2">
          {items.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-zinc-950 text-white"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}