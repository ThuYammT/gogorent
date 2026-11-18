"use client";

import LocationPicker from "@/components/owner/LocationPicker";
import { formatBookingDate } from "@/lib/booking-meetings";

export type MeetingDefaults = { time?: string | null; location?: string | null; latitude?: number | null; longitude?: number | null; instructions?: string | null };

export default function MeetingFields({ prefix, date, initial = {} }: { prefix: "pickup" | "return"; date: string; initial?: MeetingDefaults }) {
  const label = prefix === "pickup" ? "Pickup" : "Return";
  return <div className="space-y-4">
    <div><label htmlFor={`${prefix}Time`} className="text-sm font-semibold text-zinc-800">{label} time · Bangkok (UTC+7)</label>
      <p className="mb-2 mt-1 text-xs text-zinc-500">{date ? formatBookingDate(date) : "Choose the rental dates above first."}</p>
      <input id={`${prefix}Time`} name={`${prefix}Time`} type="time" required defaultValue={initial.time ?? ""} className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm" />
    </div>
    <LocationPicker fieldPrefix={prefix} compact initialLocation={initial.location} initialLatitude={initial.latitude} initialLongitude={initial.longitude} />
    <div><label htmlFor={`${prefix}Instructions`} className="text-sm font-medium text-zinc-700">Meeting instructions <span className="font-normal text-zinc-400">(optional)</span></label>
      <textarea id={`${prefix}Instructions`} name={`${prefix}Instructions`} maxLength={300} rows={2} defaultValue={initial.instructions ?? ""} placeholder="e.g. Meet at the main entrance, next to the café." className="mt-2 w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm" />
    </div>
  </div>;
}
