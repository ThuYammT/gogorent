import Link from "next/link";
import { ArrowUpRight, Package, ShoppingBag } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";

export default function RegisterPage() {
  return <AuthShell>
    <p className="auth-eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
    <h1 className="auth-title">A world of<br /><em>possibility.</em></h1>
    <p className="auth-copy">Find something for your next adventure, or share what you already have. How would you like to start?</p>
    <div className="auth-roles">
      <Link href="/register/renter" className="auth-role"><ShoppingBag size={28} strokeWidth={1.4} /><div><h2>I’m here to rent.</h2><p>Find the right thing, just for the time you need.</p></div><ArrowUpRight size={19} /></Link>
      <Link href="/register/owner" className="auth-role"><Package size={28} strokeWidth={1.4} /><div><h2>I’m here to share.</h2><p>List your items and give them a little more purpose.</p></div><ArrowUpRight size={19} /></Link>
    </div>
    <p className="auth-switch">Already have an account? <Link href="/login">Log in</Link></p>
  </AuthShell>;
}
