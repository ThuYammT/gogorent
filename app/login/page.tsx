"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  ArrowRight,
  Mail,
  LockKeyhole,
  Sparkles,
} from "lucide-react";

import Logo from "@/components/layout/Logo";

import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

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
            <span className="text-orange-500"> again.</span>
          </h1>

          <p className="mt-3 text-zinc-500">
            Log in to continue your GoGoRent journey.
          </p>

          <form action={formAction} className="mt-9 space-y-5">
            {state.error ? (
              <p
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                role="alert"
              >
                {state.error}
              </p>
            ) : null}

            <div>
              <label htmlFor="email" className="text-sm font-bold">
                Email
              </label>

              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4">
                <Mail className="h-5 w-5 text-zinc-400" />

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={isPending}
                  placeholder="you@email.com"
                  className="w-full py-4 outline-none disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-bold">
                Password
              </label>

              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4">
                <LockKeyhole className="h-5 w-5 text-zinc-400" />

                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  disabled={isPending}
                  placeholder="••••••••"
                  className="w-full py-4 outline-none disabled:opacity-60"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-4 font-black text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending ? "Logging in…" : "Log in"}
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>

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
          <div className="text-[130px]">🤝</div>

          <h2 className="mt-8 text-5xl font-black text-white">
            Share more.
            <br />
            Spend less.
          </h2>

          <p className="mt-5 text-lg leading-8 text-white/80">
            Join a community where great tech doesn&apos;t have to cost a
            fortune.
          </p>
        </div>
      </div>
    </main>
  );
}
