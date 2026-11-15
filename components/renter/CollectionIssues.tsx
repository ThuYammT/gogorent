import Link from "next/link";

import { signEvidence } from "@/lib/collection-issue-evidence";
import type { CollectionIssueDetails } from "@/lib/collection-issue-view";
import { ProposeIssueForm, RespondIssueForm } from "@/components/renter/CollectionIssueForms";

const outcomeLabels = {
  REPLACE: "Replace device",
  REPAIR: "Resolved before handover",
  CANCEL: "Cancel booking",
};

async function Evidence({ items }: { items: CollectionIssueDetails["evidence"] }) {
  if (!items.length) return null;
  let signed: Awaited<ReturnType<typeof signEvidence>>;
  try {
    signed = await signEvidence(items);
  } catch (error) {
    console.error("Could not load collection issue evidence:", error instanceof Error ? error.name : "Unknown error");
    return <p role="alert" className="mt-3 text-sm text-red-600">Could not load issue evidence. Please try again later.</p>;
  }
  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {signed.map((item) => item.mimeType.startsWith("image/") ? (
        // The signed URL grants temporary access to private issue evidence.
        // eslint-disable-next-line @next/next/no-img-element
        <img key={item.id} src={item.url} alt="Device issue evidence" className="max-h-48 max-w-full rounded-lg object-contain" />
      ) : (
        <video key={item.id} src={item.url} controls preload="metadata" className="max-h-48 max-w-full rounded-lg">
          Your browser cannot play this video.
        </video>
      ))}
    </div>
  );
}

export default function CollectionIssues({
  rentalId, issues, role, replacements = [], canAct, totalAmount,
}: {
  rentalId: string;
  issues: CollectionIssueDetails[];
  role: "OWNER" | "RENTER";
  replacements?: { id: string; name: string; condition: string }[];
  canAct: boolean;
  totalAmount: string;
}) {
  if (!issues.length) return null;
  return (
    <div className="space-y-4">
      {issues.map((issue) => (
        <section key={issue.id} className="rounded-xl border border-amber-200 bg-amber-50/40 p-5">
          <div className="flex flex-wrap justify-between gap-2">
            <h3 className="text-sm font-semibold text-zinc-900">
              {issue.category.replaceAll("_", " ")} — {issue.device.name}
            </h3>
            <span className="text-xs font-semibold text-amber-800">{issue.status}</span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{issue.description}</p>
          <p className="mt-2 text-xs text-zinc-500">Reported {issue.createdAt.toLocaleString()}</p>
          <Evidence items={issue.evidence} />

          {issue.proposedOutcome && (
            <div className="mt-4 rounded-lg bg-white p-3 text-sm text-zinc-700">
              <p className="font-semibold">Proposed outcome: {outcomeLabels[issue.proposedOutcome]}</p>
              {issue.proposedOutcome === "REPLACE" && issue.replacementDevice && (
                <p className="mt-1">
                  {issue.status === "PROPOSED" ? (
                    <Link href={`/devices/${issue.replacementDevice.id}`} className="font-semibold underline">
                      {issue.replacementDevice.name}
                    </Link>
                  ) : <span className="font-semibold">{issue.replacementDevice.name}</span>}{" "}
                  ({issue.replacementDevice.condition.replaceAll("_", " ")}).
                  Original total including deposit remains ฿{totalAmount}; a new collection QR is required.
                </p>
              )}
              {issue.proposedOutcome === "REPAIR" && <p className="mt-1">Both parties must reinspect the repaired device.</p>}
              {issue.proposedOutcome === "CANCEL" && <p className="mt-1">Payment and deposit handling is manual; no money moves automatically.</p>}
            </div>
          )}
          {issue.paymentReviewRequired && (
            <p className="mt-3 text-sm font-medium text-red-700">Existing transactions require manual payment and deposit review.</p>
          )}
          {canAct && role === "OWNER" && issue.status === "OPEN" && (
            <ProposeIssueForm rentalId={rentalId} issueId={issue.id} replacements={replacements} />
          )}
          {canAct && role === "RENTER" && issue.status === "PROPOSED" && issue.proposedOutcome && issue.proposedAt && (
            <RespondIssueForm
              rentalId={rentalId}
              issueId={issue.id}
              outcome={issue.proposedOutcome}
              proposedAt={issue.proposedAt.toISOString()}
              replacementDeviceId={issue.replacementDeviceId}
            />
          )}
          {issue.status === "PROPOSED" && role === "OWNER" && (
            <p className="mt-3 text-sm text-zinc-600">Waiting for the renter to accept or decline.</p>
          )}
        </section>
      ))}
    </div>
  );
}
