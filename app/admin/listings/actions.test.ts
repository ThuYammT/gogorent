import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, beforeEach, test } from "node:test";

const load = createRequire(__filename);
const paths = {
  auth: load.resolve("../../../lib/admin-auth"),
  prisma: load.resolve("../../../lib/prisma"),
  moderation: load.resolve("../../../lib/listing-moderation"),
  cache: load.resolve("next/cache"),
  action: load.resolve("./[id]/actions"),
};
for (const path of [paths.auth, paths.prisma, paths.moderation, paths.cache]) load(path);
const originals = Object.fromEntries(Object.entries(paths).filter(([key]) => key !== "action").map(([key, path]) => [key, load.cache[path]!.exports]));
let authorized = true;
let writes = 0;
const refreshed: string[] = [];
load.cache[paths.auth]!.exports = { requireAdmin: async () => {
  if (!authorized) throw new Error("Unauthorized");
  return { id: "admin" };
} };
load.cache[paths.prisma]!.exports = { prisma: { $transaction: async (fn: (tx: object) => Promise<void>) => fn({}) } };
load.cache[paths.moderation]!.exports = { ...originals.moderation, removeMarketplaceListing: async (_tx: object, input: { adminId: string }) => {
  assert.equal(input.adminId, "admin");
  writes++;
} };
load.cache[paths.cache]!.exports = { revalidatePath: (path: string) => refreshed.push(path) };
const { removeListing } = load("./[id]/actions") as typeof import("./[id]/actions");
beforeEach(() => { authorized = true; writes = 0; refreshed.length = 0; });
after(() => {
  for (const [key, path] of Object.entries(paths)) {
    if (key !== "action") load.cache[path]!.exports = originals[key];
  }
  delete load.cache[paths.action];
});

test("a caller without admin authorization cannot remove a listing", async () => {
  authorized = false;
  const form = new FormData();
  form.set("reason", "Requirements not met");
  await assert.rejects(removeListing("device", {}, form), /Unauthorized/);
  assert.equal(writes, 0);
  assert.deepEqual(refreshed, []);
});

test("successful admin removal refreshes public listings, saved items, and owner views", async () => {
  const form = new FormData();
  form.set("reason", "Requirements not met");
  const state = await removeListing("device", {}, form);
  assert.ok(state.success);
  assert.equal(writes, 1);
  for (const path of ["/", "/devices", "/devices/device", "/owner/devices", "/owner/devices/device", "/owner/notifications", "/renter/favorites", "/admin/listings"]) assert.ok(refreshed.includes(path));
});
