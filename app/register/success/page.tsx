import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";

export default function RegistrationSuccessPage() {
  return <AuthShell>
    <span className="auth-success-icon"><CheckCircle2 size={29} strokeWidth={1.5} /></span>
    <p className="auth-eyebrow">YOU’RE PART OF THE COMMUNITY</p>
    <h1 className="auth-title">Here’s to<br /><em>what comes next.</em></h1>
    <p className="auth-copy">Your account is ready. Log in and start your next chapter with GoGoRent.</p>
    <Link href="/login" className="auth-submit mt-8">Log in to your account<ArrowRight size={18} /></Link>
  </AuthShell>;
}
