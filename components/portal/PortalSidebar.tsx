"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Activity, AlertTriangle, ArrowUpRight, Banknote, Bell, CircleDollarSign, ClipboardList, Home, Landmark, LayoutDashboard, LogOut, Menu, Package, ReceiptText, ShieldCheck, Store, Tags, UserRound, Users, X } from "lucide-react";
import { logoutAction } from "@/app/login/actions";

type Props = {
  role: "admin" | "owner";
  user: { name: string; email: string };
  badges?: Record<string, number>;
};

const adminNavigation = [
  { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Listings", href: "/admin/listings", icon: Store },
  { label: "Categories", href: "/admin/categories", icon: Tags },
  { label: "Rentals", href: "/admin/rentals", icon: ClipboardList },
  { label: "Transactions", href: "/admin/transactions", icon: ReceiptText },
  { label: "Payouts", href: "/admin/payouts", icon: Banknote },
  { label: "Damage reports", href: "/admin/damage-reports", icon: AlertTriangle },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Audit logs", href: "/admin/audit-logs", icon: Activity },
];
const ownerNavigation = [
  { label: "Overview", href: "/owner/dashboard", icon: Home },
  { label: "My devices", href: "/owner/devices", icon: Package },
  { label: "Requests", href: "/owner/requests", icon: ClipboardList },
  { label: "Rentals", href: "/owner/rentals", icon: Store },
  { label: "Earnings", href: "/owner/earnings", icon: CircleDollarSign },
  { label: "Payout settings", href: "/owner/payout-settings", icon: Landmark },
  { label: "Notifications", href: "/owner/notifications", icon: Bell },
  { label: "Profile", href: "/owner/profile", icon: UserRound },
];

export default function PortalSidebar({ role, user, badges = {} }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLElement>(null);
  const menuId = useId();
  const navigation = role === "admin" ? adminNavigation : ownerNavigation;
  const name = user.name.trim() || (role === "admin" ? "Administrator" : "Owner");
  const initials = name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  const title = role === "admin" ? "Administration" : "Owner workspace";

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const previousFocus = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLElement>("a,button")?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const elements = dialog.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])');
      if (!elements?.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keydown);
      desktop.removeEventListener("change", closeOnDesktop);
      previousFocus?.focus();
    };
  }, [open]);

  const content = <>
    <div className="portal-brand-row"><Link href={`/${role}/dashboard`} onClick={() => setOpen(false)} className="portal-brand">GoGo<span>Rent</span><small>{title}</small></Link><button type="button" className="portal-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={19} /></button></div>
    <div className="portal-workspace-label"><span /> YOUR WORKSPACE</div>
    <nav className="portal-nav" aria-label={`${title} navigation`}>
      {navigation.map(item => {
        const active = item.href.endsWith("/dashboard") ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
        const count = badges[item.href] ?? 0;
        return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined} className={`portal-nav-link${active ? " is-active" : ""}`}><item.icon size={18} strokeWidth={1.6} /><span>{item.label}</span>{count > 0 && <span className="portal-nav-badge">{count > 99 ? "99+" : count}</span>}{active && count === 0 && <span className="portal-nav-dot" />}</Link>;
      })}
    </nav>
    <div className="portal-sidebar-bottom">
      <Link href="/devices" onClick={() => setOpen(false)} className="portal-marketplace-link"><Store size={17} /> Visit marketplace <ArrowUpRight size={16} /></Link>
      <div className="portal-sidebar-note"><span aria-hidden="true">✳</span><p>Good things.<br /><em>Better shared.</em></p></div>
      {role === "owner" ? <Link href="/owner/profile" onClick={() => setOpen(false)} className="portal-account"><span className="portal-avatar">{initials}</span><span><strong>{name}</strong><small>{user.email}</small></span><UserRound size={16} /></Link> : <div className="portal-account"><span className="portal-avatar">{initials}</span><span><strong>{name}</strong><small>{user.email}</small></span><ShieldCheck size={16} /></div>}
      <form action={logoutAction}><button type="submit" className="portal-logout"><LogOut size={15} /> Log out</button></form>
    </div>
  </>;

  return <>
    <a href="#portal-content" className="portal-skip">Skip to workspace</a>
    <div className="portal-mobile-header"><Link href={`/${role}/dashboard`} className="portal-brand">GoGo<span>Rent</span></Link><span>{title}</span><button ref={trigger} type="button" aria-label="Open navigation" aria-expanded={open} aria-controls={open ? menuId : undefined} onClick={() => setOpen(true)}><Menu size={21} />{Object.values(badges).some(count => count > 0) && <i />}</button></div>
    <aside className="portal-sidebar portal-desktop-sidebar">{content}</aside>
    {open && <div className="portal-drawer"><div className="portal-drawer-backdrop" aria-hidden="true" onClick={() => setOpen(false)} /><aside id={menuId} ref={dialog} className="portal-sidebar portal-drawer-panel" role="dialog" aria-modal="true" aria-label={`${title} menu`}>{content}</aside></div>}
  </>;
}
