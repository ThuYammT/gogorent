import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import CollectionIssues from "@/components/renter/CollectionIssues";
import { collectionIssueInclude } from "@/lib/collection-issue-view";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";

async function IssueContent({ params }: { params: Promise<{ id: string }> }) {
  const owner = await requireOwner();
  const { id } = await params;
  const rental = await prisma.rental.findFirst({
    where: { id, ownerId: owner.id },
    include: {
      collectionIssues: { include: collectionIssueInclude, orderBy: { createdAt: "desc" } },
    },
  });
  if (!rental) notFound();
  const replacements = await prisma.device.findMany({
    where: { ownerId: owner.id, status: "AVAILABLE", id: { not: rental.deviceId } },
    select: { id: true, name: true, condition: true },
    orderBy: { name: "asc" },
  });
  return (
    <main className="mx-auto max-w-4xl p-6 md:p-10">
      <Link href={`/owner/rentals#${rental.id}`} className="text-sm font-semibold text-zinc-600 underline">Back to rentals</Link>
      <h1 className="mt-5 text-2xl font-bold text-zinc-950">Collection issues</h1>
      <p className="mt-2 text-sm text-zinc-500">Booking #{rental.id.slice(-6)}</p>
      <div className="mt-6">
        {rental.collectionIssues.length ? (
          <CollectionIssues rentalId={id} issues={rental.collectionIssues} role="OWNER" replacements={replacements}
            canAct={rental.status === "APPROVED"} totalAmount={Number(rental.totalAmount).toLocaleString()} />
        ) : <p className="text-sm text-zinc-500">No collection issues have been reported.</p>}
      </div>
    </main>
  );
}

export default function OwnerIssuePage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<div className="p-6">Loading issue...</div>}><IssueContent params={params} /></Suspense>;
}
