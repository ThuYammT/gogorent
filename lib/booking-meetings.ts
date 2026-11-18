export class MeetingPlanError extends Error {}

export function bangkokToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  return ["year", "month", "day"].map(type => parts.find(part => part.type === type)!.value).join("-");
}

export function bookingDateKey(date: Date | string) {
  return (typeof date === "string" ? date : date.toISOString()).slice(0, 10);
}

export function formatBookingDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }).format(new Date(`${bookingDateKey(date)}T00:00:00Z`));
}

export function readMeetingPlan(form: FormData, prefix: "pickup" | "return", date: Date, now = new Date(), after?: Date | null) {
  const read = (field: string) => {
    const value = form.get(`${prefix}${field}`);
    return typeof value === "string" ? value.trim() : "";
  };
  const time = read("Time");
  const location = read("Location");
  const instructions = read("Instructions");
  const latitudeText = read("Latitude");
  const longitudeText = read("Longitude");
  const latitude = Number(latitudeText);
  const longitude = Number(longitudeText);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new MeetingPlanError(`Choose a valid ${prefix} time.`);
  if (!location || location.length > 1000 || !latitudeText || !longitudeText || !Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new MeetingPlanError(`Choose a ${prefix} meeting point on the map.`);
  }
  if (instructions.length > 300) throw new MeetingPlanError("Meeting instructions must be 300 characters or fewer.");
  const meetingAt = new Date(`${bookingDateKey(date)}T${time}:00+07:00`);
  if (!Number.isFinite(meetingAt.getTime()) || meetingAt <= now) throw new MeetingPlanError(`The ${prefix} meeting time must be in the future on the booking's ${prefix === "pickup" ? "start" : "end"} date (Bangkok time).`);
  if (after && meetingAt <= after) throw new MeetingPlanError("The return meeting must be after device collection.");
  return { time, location, latitude, longitude, instructions: instructions || null };
}
