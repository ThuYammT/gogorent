"use client";
import PortalSidebar from "@/components/portal/PortalSidebar";

type OwnerSidebarProps = { owner: { name: string; email: string }; unreadNotifications: number };
export default function OwnerSidebar({ owner, unreadNotifications = 0 }: OwnerSidebarProps) {
  return <PortalSidebar role="owner" user={owner} badges={{ "/owner/notifications": unreadNotifications }} />;
}
