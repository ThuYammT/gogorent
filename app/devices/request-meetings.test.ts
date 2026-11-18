import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, beforeEach, test } from "node:test";

const load = createRequire(__filename);
const paths = { session: load.resolve("../../lib/session"), prisma: load.resolve("../../lib/prisma"), notifications: load.resolve("../../lib/booking-notifications"), cache: load.resolve("next/cache"), navigation: load.resolve("next/navigation"), action: load.resolve("./[id]/actions") };
for (const [key, path] of Object.entries(paths)) if (key !== "action") load(path);
const originals = Object.fromEntries(Object.entries(paths).filter(([key]) => key !== "action").map(([key, path]) => [key, load.cache[path]!.exports]));
let saved: Record<string, unknown> | null = null;
const tx = {
  $queryRaw: async () => [],
  device: { findFirst: async () => ({ id: "device", ownerId: "owner", pricePerDay: "100", depositAmount: "500" }) },
  rental: {
    findFirst: async () => null,
    create: async ({ data }: { data: Record<string, unknown> }) => { saved = data; return { id: "booking" }; },
  },
};
load.cache[paths.session]!.exports = { requireRenter: async () => ({ id: "renter" }) };
load.cache[paths.prisma]!.exports = { prisma: { $transaction: async (fn: (value: typeof tx) => Promise<unknown>) => fn(tx) } };
load.cache[paths.notifications]!.exports = { notifyBookingEvent: async () => {} };
load.cache[paths.cache]!.exports = { revalidatePath: () => {} };
load.cache[paths.navigation]!.exports = { redirect: (path: string) => { throw new Error(`redirect:${path}`); } };
const { createRentalRequest } = load("./[id]/actions") as typeof import("./[id]/actions");
beforeEach(() => { saved = null; });
after(() => {
  for (const [key, path] of Object.entries(paths)) if (key !== "action") load.cache[path]!.exports = originals[key];
  delete load.cache[paths.action];
});
function request() {
  const form = new FormData();
  form.set("startDate", "2099-01-10"); form.set("endDate", "2099-01-11");
  form.set("pickupTime", "14:00"); form.set("pickupLocation", "Main entrance"); form.set("pickupLatitude", "13.75"); form.set("pickupLongitude", "100.5");
  form.set("pickupInstructions", "Near the security desk"); form.set("renterNote", "School project");
  return form;
}
test("new rental requests retain the proposed pickup and original note for owner review", async () => {
  await assert.rejects(createRentalRequest("device", {}, request()), /redirect:\/renter\/rentals/);
  assert.equal(saved!.pickupTime, "14:00"); assert.equal(saved!.pickupLocation, "Main entrance");
  assert.equal(saved!.pickupLatitude, 13.75); assert.equal(saved!.pickupLongitude, 100.5);
  assert.equal(saved!.pickupInstructions, "Near the security desk"); assert.equal(saved!.renterNote, "School project");
  assert.equal(saved!.totalDays, 2); assert.equal(saved!.totalAmount, 700); assert.equal(saved!.status, "REQUESTED");
});
test("missing meeting coordinates and invalid calendar dates do not create bookings", async () => {
  const noPoint = request(); noPoint.delete("pickupLatitude");
  assert.ok((await createRentalRequest("device", {}, noPoint)).error); assert.equal(saved, null);
  const invalidDate = request(); invalidDate.set("startDate", "2099-02-31");
  assert.ok((await createRentalRequest("device", {}, invalidDate)).error); assert.equal(saved, null);
});
