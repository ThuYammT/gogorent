import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, Package, QrCode } from "lucide-react";
import type { ReactNode } from "react";
import "./auth.css";

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <div className="auth-main">
        <header className="auth-header">
          <Link href="/" className="auth-brand">GoGo<span>Rent</span></Link>
          <Link href="/" className="auth-back"><ArrowLeft size={14} /> Back to exploring</Link>
        </header>
        <div className="auth-content">{children}</div>
        <footer className="auth-footer">Good things are better shared.<span>© 2026 GoGoRent</span></footer>
      </div>
      <aside className="auth-story" aria-label="GoGoRent community">
        <p className="auth-eyebrow">LESS OWNING. MORE POSSIBILITY.</p>
        <h2>Your next chapter.<br /><em>A little more possible.</em></h2>
        <p>The things you need. The freedom to try.<br />A whole world of what comes next.</p>
        <div className="auth-art" aria-hidden="true">
          <div className="auth-orbit" />
          <div className="auth-ticket"><Package size={48} strokeWidth={1.2} /><span>MAKE ROOM FOR POSSIBILITY</span><strong>Great things.<br />For your next thing.</strong><div /><span className="auth-ticket-bottom">RENT. ENJOY. RETURN.<ArrowUpRight size={20} /></span></div>
          <span className="auth-spark">✳</span>
          <div className="auth-note"><QrCode size={22} /><span>A smoother handover.<small>Scan. Confirm. You’re all set.</small></span></div>
        </div>
        <div className="auth-trust"><span><Check size={14} /> Reviewed listings</span><span><Check size={14} /> Clear daily pricing</span></div>
      </aside>
    </main>
  );
}
