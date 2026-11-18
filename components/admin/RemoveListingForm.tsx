"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { removeListing } from "@/app/admin/listings/[id]/actions";

export default function RemoveListingForm({ deviceId, pendingReview }: { deviceId: string; pendingReview: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(removeListing.bind(null, deviceId), {});
  return <section className="rounded-2xl border border-red-200 bg-white p-6">
    <h2 className="text-sm font-semibold text-zinc-950">{pendingReview ? "Reject this listing" : "Remove from marketplace"}</h2>
    <p className="mt-2 text-xs leading-5 text-zinc-500">The owner will see this item as Rejected. Its photos and rental history are retained. The owner can edit it and submit it for review again.</p>
    {state.success ? <p role="status" className="mt-4 text-sm text-emerald-700">{state.success}</p> : !open ? (
      <button type="button" onClick={() => setOpen(true)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50"><Trash2 size={16} />{pendingReview ? "Reject listing" : "Remove listing"}</button>
    ) : <form action={action} className="mt-4 space-y-3">
      <label htmlFor={`remove-reason-${deviceId}`} className="block text-sm font-medium text-zinc-700">Reason for the owner</label>
      <textarea id={`remove-reason-${deviceId}`} name="reason" required maxLength={1000} rows={4} disabled={pending} placeholder="Explain which requirements this item does not meet…" className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:border-red-300 focus:outline-none" />
      <p className="text-xs leading-5 text-zinc-500">This immediately hides the item from public listings. Items with unresolved bookings must be handled in <Link href="/admin/rentals" className="underline">Rentals</Link> first.</p>
      {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      <button type="submit" disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-3 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50"><Trash2 size={16} />{pending ? "Removing…" : "Confirm rejection and removal"}</button>
      <button type="button" disabled={pending} onClick={() => setOpen(false)} className="w-full py-2 text-sm text-zinc-500">Cancel</button>
    </form>}
  </section>;
}
