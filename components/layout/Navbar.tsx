import Link from "next/link";
import { Suspense } from "react";

import {
  Bell,
  Heart,
  LayoutDashboard,
  LogOut,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";

import { logoutAction } from "@/app/login/actions";
import { getSession } from "@/lib/session";

function NavbarFallback() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-6">
        <Link
          href="/"
          className="text-xl font-extrabold tracking-tight text-zinc-950"
        >
          GoGo<span className="text-amber-500">Rent</span>
        </Link>
      </div>
    </header>
  );
}

async function NavbarContent() {
  const session = await getSession();

  const dashboardHref =
    session?.role === "ADMIN"
      ? "/admin/dashboard"
      : session?.role === "OWNER"
        ? "/owner/dashboard"
        : "/renter/dashboard";

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 lg:px-6">
        <Link
          href="/"
          className="shrink-0 text-xl font-extrabold tracking-tight text-zinc-950"
        >
          GoGo<span className="text-amber-500">Rent</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-600 transition hover:text-zinc-950"
          >
            Home
          </Link>

          <Link
            href="/devices"
            className="text-sm font-medium text-zinc-600 transition hover:text-zinc-950"
          >
            Browse
          </Link>

          <Link
            href="/#how-it-works"
            className="text-sm font-medium text-zinc-600 transition hover:text-zinc-950"
          >
            How it works
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {!session ? (
            <>
              <Link
                href="/login"
                className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 sm:inline-flex"
              >
                Log in
              </Link>

              <Link
                href="/register"
                className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Create account
              </Link>
            </>
          ) : session.role === "RENTER" ? (
            <>
              <Link
                href="/renter/favorites"
                className="hidden rounded-xl p-2.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 sm:inline-flex"
                aria-label="Saved devices"
              >
                <Heart className="h-5 w-5" />
              </Link>

              <Link
                href="/renter/notifications"
                className="hidden rounded-xl p-2.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 sm:inline-flex"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
              </Link>

              <Link
                href="/renter/rentals"
                className="hidden items-center gap-2 rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 md:inline-flex"
              >
                <ShoppingBag className="h-4 w-4" />
                My bookings
              </Link>

              <Link
                href="/renter/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                <UserRound className="h-4 w-4" />
                Account
              </Link>

              <form action={logoutAction}>
                <button
                  type="submit"
                  className="hidden rounded-xl p-2.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-red-600 lg:inline-flex"
                  aria-label="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/devices"
                className="hidden items-center gap-2 rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 sm:inline-flex"
              >
                <Search className="h-4 w-4" />
                Marketplace
              </Link>

              <Link
                href={dashboardHref}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                <LayoutDashboard className="h-4 w-4" />
                {session.role === "ADMIN"
                  ? "Admin panel"
                  : "Owner panel"}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<NavbarFallback />}>
      <NavbarContent />
    </Suspense>
  );
}