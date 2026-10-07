import Link from "next/link";
import {
  Heart,
  Menu,
  Search,
} from "lucide-react";

import Logo from "./Logo";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-yellow-100 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Logo />

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
            href="#how-it-works"
            className="text-sm font-semibold text-zinc-600 transition hover:text-orange-500"
          >
            How it works
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-50 transition hover:bg-yellow-100">
            <Heart className="h-5 w-5" />
          </button>

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
        </div>

        <button className="md:hidden">
          <Menu />
        </button>
      </div>
    </header>
  );
}