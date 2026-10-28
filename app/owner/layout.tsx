import { Suspense } from "react";

import OwnerSidebar from "@/components/owner/OwnerSidebar";
import { requireOwner } from "@/lib/session";

type OwnerLayoutProps = {
  children: React.ReactNode;
};

async function OwnerShell({
  children,
}: OwnerLayoutProps) {
  const owner = await requireOwner();

  return (
    <div className="min-h-screen bg-[#f6f7f9] lg:flex">
      <div className="hidden lg:block">
        <OwnerSidebar
          name={owner.name}
          email={owner.email}
        />
      </div>

      <main className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}

function OwnerShellLoading() {
  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      <div className="h-screen animate-pulse bg-zinc-100" />
    </div>
  );
}

export default function OwnerLayout({
  children,
}: OwnerLayoutProps) {
  return (
    <Suspense
      fallback={<OwnerShellLoading />}
    >
      <OwnerShell>
        {children}
      </OwnerShell>
    </Suspense>
  );
}