import { MapPin, Clock3, ArrowUpRight } from "lucide-react";
import { formatBookingDate } from "@/lib/booking-meetings";

type MeetingBooking = {
  startDate: Date; endDate: Date;
  pickupTime: string | null; pickupLocation: string | null; pickupLatitude: number | null; pickupLongitude: number | null; pickupInstructions: string | null;
  returnTime: string | null; returnLocation: string | null; returnLatitude: number | null; returnLongitude: number | null; returnInstructions: string | null;
};

export default function BookingMeetupDetails({ rental, pickupOnly = false }: { rental: MeetingBooking; pickupOnly?: boolean }) {
  const meetings = [
    { label: "Pickup meeting", date: rental.startDate, time: rental.pickupTime, location: rental.pickupLocation, latitude: rental.pickupLatitude, longitude: rental.pickupLongitude, instructions: rental.pickupInstructions },
    ...(!pickupOnly ? [{ label: "Return meeting", date: rental.endDate, time: rental.returnTime, location: rental.returnLocation, latitude: rental.returnLatitude, longitude: rental.returnLongitude, instructions: rental.returnInstructions }] : []),
  ];
  return <div className={`grid gap-3 ${pickupOnly ? "" : "sm:grid-cols-2"}`}>{meetings.map(meeting => <section key={meeting.label} className="min-w-0 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
    <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-600">{meeting.label}</h3>
    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-zinc-900"><Clock3 size={15} className="shrink-0" />{formatBookingDate(meeting.date)}{meeting.time ? ` · ${meeting.time}` : ""}</p>
    <p className="mt-1 text-xs text-zinc-500">{meeting.time ? "Bangkok time (UTC+7)" : "Time not arranged yet"}</p>
    <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-zinc-700"><MapPin size={15} className="mt-1 shrink-0" />{meeting.location ?? (meeting.label === "Pickup meeting" ? "No meeting point was supplied for this booking." : "The renter will arrange the return after collection.")}</p>
    {meeting.instructions && <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-zinc-600">{meeting.instructions}</p>}
    {meeting.latitude !== null && meeting.longitude !== null && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${meeting.latitude},${meeting.longitude}`)}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 underline underline-offset-2">Open meeting point in maps <ArrowUpRight size={13} /></a>}
  </section>)}</div>;
}
