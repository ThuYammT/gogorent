import {
  Suspense,
  type ReactNode,
} from "react";

import RenterSidebar from "@/components/renter/RenterSidebar";
import { prisma } from "@/lib/prisma";
import { requireRenter } from "@/lib/session";

async function RenterShell({
  children,
}: {
  children: ReactNode;
}) {
  const renter = await requireRenter();

  const unreadCount =
    await prisma.notification.count({
      where: {
        userId: renter.id,
        isRead: false,
      },
    });

  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      <RenterSidebar
        renter={{
          name: renter.name,
          email: renter.email,
        }}
        unreadCount={unreadCount}
      />

      <div className="min-h-screen lg:pl-72">
        {children}
      </div>
    </div>
  );
}

export default function RenterLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f6f7f9] p-6 text-sm text-zinc-500">
          Loading renter workspace...
        </div>
      }
    >
      <RenterShell>
        {children}
      </RenterShell>
    </Suspense>
  );
}