import {
  Suspense,
  type ReactNode,
} from "react";

import Navbar from "@/components/layout/Navbar";
import RenterAccountNav from "@/components/renter/RenterAccountNav";
import { requireRenter } from "@/lib/session";

async function RenterContent({
  children,
}: {
  children: ReactNode;
}) {
  await requireRenter();

  return (
    <div className="min-h-screen bg-[#f7f7f8]">
      <Navbar />
      <RenterAccountNav />

      {children}
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
        <div className="min-h-screen bg-[#f7f7f8] p-6 text-sm text-zinc-500">
          Loading account...
        </div>
      }
    >
      <RenterContent>
        {children}
      </RenterContent>
    </Suspense>
  );
}