import assert from "node:assert/strict";
import test from "node:test";
import { bangkokToday, readMeetingPlan } from "./booking-meetings";

const now = new Date("2026-11-18T03:00:00Z");
const date = new Date("2026-11-19T00:00:00Z");
function form(prefix = "pickup") {
  const value = new FormData();
  for (const [key, entry] of Object.entries({ Time: "14:30", Location: "  Main entrance  ", Latitude: "13.7563", Longitude: "100.5018", Instructions: "  Near the café  " })) value.set(`${prefix}${key}`, entry);
  return value;
}
test("meeting validation saves normalized location, coordinates, instructions and Bangkok time", () => {
  assert.deepEqual(readMeetingPlan(form(), "pickup", date, now), { time: "14:30", location: "Main entrance", latitude: 13.7563, longitude: 100.5018, instructions: "Near the café" });
  const atZero = form(); atZero.set("pickupLatitude", "0"); atZero.set("pickupLongitude", "0");
  assert.equal(readMeetingPlan(atZero, "pickup", date, now).latitude, 0);
});
test("meeting validation rejects missing or invalid time, map point and oversized instructions", () => {
  for (const [key, value] of [["Time", "24:00"], ["Time", ""], ["Latitude", ""], ["Longitude", "NaN"], ["Latitude", "91"], ["Longitude", "181"], ["Location", ""], ["Instructions", "x".repeat(301)]]) {
    const invalid = form(); invalid.set(`pickup${key}`, value);
    assert.throws(() => readMeetingPlan(invalid, "pickup", date, now));
  }
});
test("meeting times use Bangkok rather than host timezone and cannot precede collection", () => {
  const value = form(); value.set("pickupTime", "09:59");
  assert.throws(() => readMeetingPlan(value, "pickup", new Date("2026-11-18T00:00:00Z"), now), /future/);
  const returning = form("return");
  assert.throws(() => readMeetingPlan(returning, "return", date, now, new Date("2026-11-19T08:00:00Z")), /after device collection/);
  assert.equal(bangkokToday(new Date("2026-11-18T18:30:00Z")), "2026-11-19");
});
