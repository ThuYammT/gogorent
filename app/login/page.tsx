import Link from "next/link";
import {
  ArrowRight,
  Mail,
  LockKeyhole,
  Sparkles,
} from "lucide-react";

import Logo from "@/components/layout/Logo";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-[#fffdf7] lg:grid-cols-2">
      <div className="flex flex-col px-8 py-8 md:px-16">
        <Logo />

        <div className="mx-auto my-auto w-full max-w-md py-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-2 text-sm font-bold text-orange-600">
            <Sparkles className="h-4 w-4" />
            Welcome back
          </span>

          <h1 className="mt-6 text-4xl font-black">
            Good to see you
            <span className="text-orange-500">
              {" "}again.
            </span>
          </h1>

          <p className="mt-3 text-zinc-500">
            Log in to continue your GoGoRent journey.
          </p>

          <div className="mt-9 space-y-5">
            <div>
              <label className="text-sm font-bold">
                Email
              </label>

              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4">
                <Mail className="h-5 w-5 text-zinc-400" />

                <input
                  type="email"
                  placeholder="you@email.com"
                  className="w-full py-4 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold">
                Password
              </label>

              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4">
                <LockKeyhole className="h-5 w-5 text-zinc-400" />

                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full py-4 outline-none"
                />
              </div>
            </div>
          </div>

          <Link
            href="/renter/dashboard"
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-4 font-black text-white transition hover:bg-orange-500"
          >
            Log in
            <ArrowRight className="h-5 w-5" />
          </Link>

          <p className="mt-7 text-center text-sm text-zinc-500">
            New here?{" "}
            <Link
              href="/register"
              className="font-bold text-orange-500"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden items-center justify-center bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 p-16 lg:flex">
        <div className="max-w-lg">
          <div className="text-[130px]">
            🤝
          </div>

          <h2 className="mt-8 text-5xl font-black text-white">
            Share more.
            <br />
            Spend less.
          </h2>

          <p className="mt-5 text-lg leading-8 text-white/80">
            Join a community where great tech doesn't
            have to cost a fortune.
          </p>
        </div>
      </div>
    </main>
  );
}