"use client";
import PortalSidebar from "@/components/portal/PortalSidebar";

type AdminSidebarProps = {
  admin: { name: string; email: string };
  pendingListings: number;
  openDamageReports: number;
  unreadNotifications: number;
};
export default function AdminSidebar({ admin, pendingListings = 0, openDamageReports = 0, unreadNotifications = 0 }: AdminSidebarProps) {
  return <PortalSidebar role="admin" user={admin} badges={{ "/admin/listings": pendingListings, "/admin/damage-reports": openDamageReports, "/admin/notifications": unreadNotifications }} />;
}
