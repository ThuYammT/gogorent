"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, Mail, LockKeyhole } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  return <AuthShell>
    <p className="auth-eyebrow">PICK UP WHERE YOU LEFT OFF</p>
    <h1 className="auth-title">Good to see<br /><em>you again.</em></h1>
    <p className="auth-copy">Your next possibility is waiting. Log in to your account and make it happen.</p>
    <form action={formAction} className="auth-form" aria-busy={isPending}>
      {state.error && <p className="auth-error" role="alert">{state.error}</p>}
      <div><label htmlFor="email">Email address</label><div className="auth-field"><Mail aria-hidden="true" /><input id="email" name="email" type="email" autoComplete="email" required disabled={isPending} placeholder="you@example.com" /></div></div>
      <div><label htmlFor="password">Password</label><div className="auth-field"><LockKeyhole aria-hidden="true" /><input id="password" name="password" type="password" autoComplete="current-password" required disabled={isPending} placeholder="Enter your password" /></div></div>
      <button type="submit" disabled={isPending} className="auth-submit">{isPending ? "Logging in…" : "Log in"}<ArrowRight size={18} /></button>
    </form>
    <p className="auth-switch">A new beginning? <Link href="/register">Create an account</Link></p>
  </AuthShell>;
}
