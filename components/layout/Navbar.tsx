import Link from "next/link";

import {
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
} from "lucide-react";

import { logoutAction } from "@/app/login/actions";
import { getSession } from "@/lib/session";

import Logo from "./Logo";

function dashboardForRole(
  role: "RENTER" | "OWNER" | "ADMIN",
) {
  switch (role) {
    case "OWNER":
      return "/owner/dashboard";

    case "ADMIN":
      return "/admin/dashboard";

    case "RENTER":
    default:
      return "/renter/dashboard";
  }
}

function dashboardLabel(
  role: "RENTER" | "OWNER" | "ADMIN",
) {
  switch (role) {
    case "OWNER":
      return "Owner Dashboard";

    case "ADMIN":
      return "Admin Dashboard";

    case "RENTER":
    default:
      return "My Dashboard";
  }
}

export default async function Navbar() {
  const session =
    await getSession();

  return (
    <header className="sticky top-0 z-50 border-b border-yellow-100 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Logo />

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/"
            className="text-sm font-semibold text-zinc-600 transition hover:text-orange-500"
          >
            Home
          </Link>

          <Link
            href="/devices"
            className="text-sm font-semibold text-zinc-600 transition hover:text-orange-500"
          >
            Explore
          </Link>

          <Link
            href="/#how-it-works"
            className="text-sm font-semibold text-zinc-600 transition hover:text-orange-500"
          >
            How it works
          </Link>
        </nav>

        {/* DESKTOP ACCOUNT AREA */}
        <div className="hidden items-center gap-3 md:flex">
          {session ? (
            <>
              {session.role ===
                "RENTER" && (
                <Link
                  href="/renter/favorites"
                  aria-label="Favorites"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-50 transition hover:bg-yellow-100"
                >
                  <Heart className="h-5 w-5" />
                </Link>
              )}

              <Link
                href={dashboardForRole(
                  session.role,
                )}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100"
              >
                <LayoutDashboard className="h-4 w-4" />

                {dashboardLabel(
                  session.role,
                )}
              </Link>

              <form
                action={
                  logoutAction
                }
              >
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-500"
                >
                  <LogOut className="h-4 w-4" />

                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-5 py-2.5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100"
              >
                Log in
              </Link>

              <Link
                href="/register"
                className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-500"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        {/* MOBILE */}
        <button
          type="button"
          aria-label="Open menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg transition hover:bg-zinc-100 md:hidden"
        >
          <Menu />
        </button>
      </div>
    </header>
  );
}