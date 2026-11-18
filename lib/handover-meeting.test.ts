import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, test } from "node:test";

const load = createRequire(__filename);
const sessionPath = load.resolve("./session");
const prismaPath = load.resolve("./prisma");
const handoverPath = load.resolve("./handover");
load(sessionPath); load(prismaPath);
const originals = { session: load.cache[sessionPath]!.exports, prisma: load.cache[prismaPath]!.exports };
let planned = false;
let codes = 0;
let overdue = false;
const tx = {
  $queryRaw: async () => [],
  rental: { findUnique: async () => ({ id: "booking", renterId: "renter", ownerId: "owner", status: "ACTIVE", endDate: overdue ? new Date("2000-01-01T00:00:00Z") : new Date("2099-01-01T00:00:00Z"), returnTime: planned ? "15:00" : null, returnLocation: planned ? "Main entrance" : null }) },
  handover: { findUnique: async () => null, upsert: async () => { codes++; return { id: "handover" }; } },
  auditLog: { create: async () => {} },
  notification: { create: async () => {} },
};
load.cache[sessionPath]!.exports = { getSession: async () => ({ userId: "renter", role: "RENTER" }) };
load.cache[prismaPath]!.exports = { prisma: { $transaction: async (fn: (value: typeof tx) => Promise<unknown>) => fn(tx) } };
const { initiateHandover } = load("./handover") as typeof import("./handover");
after(() => {
  load.cache[sessionPath]!.exports = originals.session; load.cache[prismaPath]!.exports = originals.prisma; delete load.cache[handoverPath];
});
test("a renter must arrange a return meeting before a return QR can be generated", async () => {
  await assert.rejects(initiateHandover("booking", "RETURN"), /Save your return meeting/);
  assert.equal(codes, 0);
  planned = true;
  const result = await initiateHandover("booking", "RETURN");
  assert.ok(result.token);
  assert.equal(codes, 1);
});

test("overdue bookings can still be returned without being trapped by a past planning date", async () => {
  overdue = true;
  planned = false;
  const result = await initiateHandover("booking", "RETURN");
  assert.ok(result.token);
});
