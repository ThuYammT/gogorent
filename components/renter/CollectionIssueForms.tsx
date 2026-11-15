"use client";

import { useActionState, useState } from "react";

import { proposeIssue, reportIssue, respondToIssue } from "@/app/actions/collection-issues";

function Feedback({ state }: { state: { error: string } | { success: true } | null }) {
  if (!state) return null;
  return "error" in state
    ? <p role="alert" className="mt-3 text-sm text-red-600">{state.error}</p>
    : <p role="status" className="mt-3 text-sm text-emerald-700">Saved successfully.</p>;
}

const button = "rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50";
const field = "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm";

export function ReportIssueForm({ rentalId }: { rentalId: string }) {
  const [state, action, pending] = useActionState(reportIssue.bind(null, rentalId), null);
  return (
    <details className="mt-4 rounded-xl border border-zinc-200 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-red-700">Report device issue</summary>
      <form action={action} className="mt-4 space-y-4">
        <label className="block text-sm font-medium">
          Fault category
          <select name="category" required defaultValue="" className={field}>
            <option value="" disabled>Choose a category</option>
            <option value="POWER">Power or charging</option>
            <option value="FUNCTIONALITY">Functionality</option>
            <option value="PHYSICAL_DAMAGE">Physical damage</option>
            <option value="MISSING_ACCESSORY">Missing accessory</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          Describe the issue
          <textarea name="description" required minLength={10} maxLength={2000} rows={4} className={field} />
        </label>
        <label className="block text-sm font-medium">
          Photos or videos (optional)
          <input name="evidence" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" multiple className="mt-2 block w-full text-sm" />
          <span className="mt-1 block text-xs text-zinc-500">Up to 5 files, 10 MB each. JPG, PNG, WebP, MP4, MOV or WebM.</span>
        </label>
        <p className="text-xs text-zinc-500">Collection is paused until both parties agree on a resolution.</p>
        <button type="submit" disabled={pending} className={button}>{pending ? "Submitting..." : "Submit issue"}</button>
        <Feedback state={state} />
      </form>
    </details>
  );
}

export function ProposeIssueForm({
  rentalId, issueId, replacements,
}: {
  rentalId: string;
  issueId: string;
  replacements: { id: string; name: string; condition: string }[];
}) {
  const [state, action, pending] = useActionState(proposeIssue.bind(null, rentalId, issueId), null);
  const [outcome, setOutcome] = useState("");
  return (
    <form action={action} className="mt-4 space-y-4 border-t border-zinc-200 pt-4">
      <label className="block text-sm font-medium">
        Propose a resolution
        <select name="outcome" value={outcome} onChange={(event) => setOutcome(event.target.value)} required className={field}>
          <option value="" disabled>Choose an outcome</option>
          <option value="REPLACE">Replace device</option>
          <option value="REPAIR">Resolved before handover</option>
          <option value="CANCEL">Cancel booking</option>
        </select>
      </label>
      {outcome === "REPLACE" && (
        <label className="block text-sm font-medium">
          Available replacement (original price and deposit stay unchanged)
          <select name="replacementDeviceId" required defaultValue="" className={field}>
            <option value="" disabled>Choose a device</option>
            {replacements.map((device) => (
              <option key={device.id} value={device.id}>{device.name} — {device.condition.replaceAll("_", " ")}</option>
            ))}
          </select>
        </label>
      )}
      {outcome === "REPAIR" && (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="inspected" value="confirmed" required className="mt-1" />
          I have fixed and reinspected the device with the renter.
        </label>
      )}
      {outcome === "CANCEL" && (
        <p className="text-sm text-zinc-600">Existing payments and deposits require manual review; no money will move automatically.</p>
      )}
      <button type="submit" disabled={pending} className={button}>{pending ? "Sending..." : "Send proposal"}</button>
      <Feedback state={state} />
    </form>
  );
}

export function RespondIssueForm({
  rentalId, issueId, outcome, proposedAt, replacementDeviceId,
}: {
  rentalId: string;
  issueId: string;
  outcome: string;
  proposedAt: string;
  replacementDeviceId: string | null;
}) {
  const [state, action, pending] = useActionState(respondToIssue.bind(null, rentalId, issueId), null);
  return (
    <form action={action} className="mt-4 space-y-3 border-t border-zinc-200 pt-4">
      <input type="hidden" name="outcome" value={outcome} />
      <input type="hidden" name="proposedAt" value={proposedAt} />
      <input type="hidden" name="replacementDeviceId" value={replacementDeviceId ?? ""} />
      {outcome === "REPAIR" && (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="inspected" value="confirmed" className="mt-1" />
          I reinspected the device and agree the issue is resolved.
        </label>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="submit" name="response" value="accept" disabled={pending} className={button}>Accept proposal</button>
        <button type="submit" name="response" value="decline" disabled={pending} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 disabled:opacity-50">Decline</button>
      </div>
      <Feedback state={state} />
    </form>
  );
}
