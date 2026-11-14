"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowLeft, ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";

import Logo from "@/components/layout/Logo";
import { registerAction, type RegistrationState } from "./actions";

const initialState: RegistrationState = {};

export default function RegistrationForm({ role }: { role: "RENTER" | "OWNER" }) {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const roleName = role === "RENTER" ? "renter" : "owner";

  return (
    <main className="min-h-screen bg-[#fffdf7] px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <Logo />
        <div className="mx-auto max-w-md py-12">
          <Link href="/register" className="inline-flex items-center gap-2 text-sm font-bold text-orange-500">
            <ArrowLeft className="h-4 w-4" /> Choose another role
          </Link>
          <h1 className="mt-6 text-4xl font-black">
            Join as {role === "RENTER" ? "a" : "an"}{" "}
            <span className="text-orange-500">{roleName}.</span>
          </h1>
          <p className="mt-3 text-zinc-500">
            {role === "RENTER"
              ? "Create an account to find your next rental."
              : "Create an account to start listing your devices."}
          </p>

          <form action={formAction} className="mt-8 space-y-5">
            <input type="hidden" name="role" value={role} />
            {state.error && (
              <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {state.error}
              </p>
            )}
            <div>
              <label htmlFor="name" className="text-sm font-bold">Name</label>
              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4">
                <UserRound className="h-5 w-5 text-zinc-400" />
                <input id="name" name="name" autoComplete="name" required maxLength={100}
                  value={name} onChange={(event) => setName(event.target.value)} disabled={isPending}
                  placeholder="Your name" className="w-full py-4 outline-none disabled:opacity-60" />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-bold">Email</label>
              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4">
                <Mail className="h-5 w-5 text-zinc-400" />
                <input id="email" name="email" type="email" autoComplete="email" required
                  value={email} onChange={(event) => setEmail(event.target.value)} disabled={isPending}
                  placeholder="you@email.com" className="w-full py-4 outline-none disabled:opacity-60" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-bold">Password</label>
              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4">
                <LockKeyhole className="h-5 w-5 text-zinc-400" />
                <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8}
                  disabled={isPending} placeholder="At least 8 characters" className="w-full py-4 outline-none disabled:opacity-60" />
              </div>
              <p className="mt-2 text-xs text-zinc-500">Use at least 8 characters and no more than 72 bytes.</p>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="text-sm font-bold">Confirm password</label>
              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4">
                <LockKeyhole className="h-5 w-5 text-zinc-400" />
                <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required
                  disabled={isPending} placeholder="Repeat your password" className="w-full py-4 outline-none disabled:opacity-60" />
              </div>
            </div>
            <button type="submit" disabled={isPending} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-4 font-black text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-70">
              {isPending ? "Creating account…" : "Create account"} <ArrowRight className="h-5 w-5" />
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-orange-500">Log in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
