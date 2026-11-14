import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import Logo from "@/components/layout/Logo";

export default function RegistrationSuccessPage() {
  return (
    <main className="min-h-screen bg-[#fffdf7] px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <Logo />
        <div className="mx-auto max-w-md py-24 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-orange-500" />
          <h1 className="mt-6 text-4xl font-black">Account created!</h1>
          <p className="mt-4 text-zinc-500">You can now log in to your GoGoRent account.</p>
          <Link href="/login" className="mt-8 inline-flex rounded-2xl bg-zinc-900 px-8 py-4 font-black text-white transition hover:bg-orange-500">
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}
