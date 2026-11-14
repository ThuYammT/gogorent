import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { requireRenter } from "@/lib/session";

async function RenterShell({
  children,
}: {
  children: ReactNode;
}) {
  await requireRenter();

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link
            href="/renter/dashboard"
            className="text-lg font-black text-zinc-950"
          >
            GoGo<span className="text-orange-500">Rent</span>
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium text-zinc-600">
            <Link href="/renter/rentals" className="hover:text-zinc-950">
              Bookings
            </Link>
            <Link
              href="/renter/notifications"
              className="hover:text-zinc-950"
            >
              Notifications
            </Link>
            <Link href="/devices" className="hover:text-zinc-950">
              Browse devices
            </Link>
            <Link href="/renter/favorites" className="hover:text-zinc-950">
              Saved
            </Link>
            <Link href="/renter/profile" className="hover:text-zinc-950">
              Profile
            </Link>
          </div>
        </nav>
      </header>
      {children}
    </div>
  );
}

export default function RenterLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fafafa] p-6 text-sm text-zinc-500">
          Loading renter workspace...
        </div>
      }
    >
      <RenterShell>{children}</RenterShell>
    </Suspense>
  );
}