"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowLeft, ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { registerAction, type RegistrationState } from "./actions";

const initialState: RegistrationState = {};

export default function RegistrationForm({ role }: { role: "RENTER" | "OWNER" }) {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const isOwner = role === "OWNER";
  return <AuthShell>
    <Link href="/register" className="auth-role-back"><ArrowLeft size={14} /> Choose another role</Link>
    <p className="auth-eyebrow">{isOwner ? "GOOD THINGS DESERVE TO BE SHARED" : "MAKE ROOM FOR WHAT’S NEXT"}</p>
    <h1 className="auth-title">{isOwner ? "Share something" : "Find something"}<br /><em>{isOwner ? "worth discovering." : "worth trying."}</em></h1>
    <p className="auth-copy">{isOwner ? "Create an owner account and give your items a new chapter." : "Create a renter account. Your next great find starts here."}</p>
    <form action={formAction} className="auth-form" aria-busy={isPending}>
      <input type="hidden" name="role" value={role} />
      {state.error && <p role="alert" className="auth-error">{state.error}</p>}
      <div><label htmlFor="name">Full name</label><div className="auth-field"><UserRound aria-hidden="true" /><input id="name" name="name" autoComplete="name" required maxLength={100} value={name} onChange={event => setName(event.target.value)} disabled={isPending} placeholder="Your name" /></div></div>
      <div><label htmlFor="email">Email address</label><div className="auth-field"><Mail aria-hidden="true" /><input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} disabled={isPending} placeholder="you@example.com" /></div></div>
      <div><label htmlFor="password">Password</label><div className="auth-field"><LockKeyhole aria-hidden="true" /><input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} aria-describedby="password-help" disabled={isPending} placeholder="At least 8 characters" /></div><p id="password-help" className="auth-help">Use at least 8 characters and no more than 72 bytes.</p></div>
      <div><label htmlFor="confirmPassword">Confirm password</label><div className="auth-field"><LockKeyhole aria-hidden="true" /><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required disabled={isPending} placeholder="Repeat your password" /></div></div>
      <button type="submit" disabled={isPending} className="auth-submit">{isPending ? "Creating account…" : `Create ${isOwner ? "owner" : "renter"} account`}<ArrowRight size={18} /></button>
    </form>
    <p className="auth-switch">Already part of the community? <Link href="/login">Log in</Link></p>
  </AuthShell>;
}
