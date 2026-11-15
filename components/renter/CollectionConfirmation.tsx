"use client";

import { useActionState } from "react";

import { confirmCollectionReceipt } from "@/app/renter/rentals/actions";

export default function CollectionConfirmation({
  rentalId,
  condition,
}: {
  rentalId: string;
  condition: string;
}) {
  const [state, action, pending] = useActionState(
    confirmCollectionReceipt.bind(null, rentalId),
    null,
  );

  if (state && "success" in state) {
    return (
      <p role="status" className="text-sm font-semibold text-emerald-700">
        Collection confirmed. Your rental is active and payment is pending. Online payment is not available yet.
      </p>
    );
  }

  return (
    <form action={action} className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-5">
      <input type="hidden" name="listedCondition" value={condition} />
      <h3 className="text-sm font-semibold text-zinc-900">Confirm device collection</h3>
      <p className="mt-2 text-sm text-zinc-600">
        Listed condition: <span className="font-semibold">{condition.replaceAll("_", " ")}</span>.
        Inspect the device and accessories before confirming. If the condition differs, do not confirm; contact the owner.
      </p>
      <label className="mt-4 flex items-start gap-3 text-sm text-zinc-700">
        <input type="checkbox" name="condition" value="confirmed" required className="mt-1" />
        <span>I inspected the device and confirm its condition matches the listing.</span>
      </label>
      <label className="mt-3 flex items-start gap-3 text-sm text-zinc-700">
        <input type="checkbox" name="received" value="confirmed" required className="mt-1" />
        <span>I received the device and its accessories.</span>
      </label>
      <p className="mt-4 text-xs text-zinc-500">
        Confirming activates the rental and creates a pending payment for the rental and deposit.
        No payment will be charged yet.
      </p>
      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {pending ? "Confirming..." : "Confirm receipt and condition"}
      </button>
      {state && "error" in state && (
        <p role="alert" className="mt-3 text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}
