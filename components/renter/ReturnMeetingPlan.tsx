"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, X } from "lucide-react";
import MeetingFields, { type MeetingDefaults } from "@/components/bookings/MeetingFields";
import { formatBookingDate } from "@/lib/booking-meetings";
import { saveReturnMeeting } from "@/app/renter/rentals/meeting-actions";

export default function ReturnMeetingPlan({ rentalId, date, initial }: { rentalId: string; date: string; initial: MeetingDefaults }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(saveReturnMeeting.bind(null, rentalId), {});
  function openDialog() {
    dialog.current?.showModal();
    setOpen(true);
  }
  useEffect(() => {
    if (initial.time) return;
    const timer = window.setTimeout(() => { dialog.current?.showModal(); setOpen(true); }, 0);
    return () => window.clearTimeout(timer);
  }, [initial.time]);
  useEffect(() => {
    if (state.success) { dialog.current?.close(); router.refresh(); }
  }, [state, router]);
  return <div className="mb-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="flex items-center gap-2 text-sm font-semibold text-zinc-900"><MapPin size={16} />{initial.time ? "Return meeting saved" : "Arrange your return meeting"}</p><p className="mt-1 text-xs leading-5 text-zinc-500">Return date: {formatBookingDate(date)}. The owner will be notified of your meeting plan.</p></div>
      <button type="button" onClick={openDialog} disabled={pending} className="rounded-lg bg-zinc-950 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{initial.time ? "Update return plan" : "Plan return"}</button></div>
    <dialog ref={dialog} onClose={() => setOpen(false)} aria-labelledby={titleId} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-xl overflow-y-auto rounded-2xl border border-zinc-200 bg-[#fffefa] p-5 text-zinc-900 shadow-xl backdrop:bg-zinc-950/50 sm:p-7">
      <div className="flex items-start justify-between gap-4"><div><h2 id={titleId} className="text-xl font-semibold tracking-tight">When and where will you return it?</h2><p className="mt-2 text-sm leading-6 text-zinc-500">Your rental ends on {formatBookingDate(date)}. Choose a time and a meeting point for the owner.</p></div><button type="button" disabled={pending} onClick={() => dialog.current?.close()} aria-label="Close return meeting form" className="rounded-lg p-1.5 text-zinc-500"><X size={20} /></button></div>
      <form action={action} className="mt-5 space-y-5"><fieldset disabled={pending}>{open && <MeetingFields prefix="return" date={date} initial={initial} />}</fieldset>
        {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
        <button type="submit" disabled={pending} className="w-full rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Saving…" : "Save return meeting and notify owner"}</button>
        <button type="button" disabled={pending} onClick={() => dialog.current?.close()} className="w-full text-sm text-zinc-500">I’ll do this later</button>
      </form>
    </dialog>
  </div>;
}
