import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, test } from "node:test";

import { hashHandoverToken } from "./handover-tokens";

const token = "a".repeat(64);
let actor = { userId: "renter", role: "RENTER" };
let bookingStatus = "APPROVED";
let handoverStatus = "INITIATED";
let expiresAt = new Date(Date.now() + 60_000);
let attempts = 0;
const notifications: { userId: string; type: string }[] = [];
const audits: string[] = [];

const rental = { id: "booking", renterId: "renter", ownerId: "owner" };
const transaction = {
  $queryRaw: async () => [],
  rental: { findUnique: async () => ({ ...rental, status: bookingStatus }) },
  handover: {
    updateMany: async ({ where }: {
      where: { rentalId: string; tokenHash: string; status: string; expiresAt: { gt: Date } };
    }) => {
      if (
        where.rentalId !== rental.id ||
        where.tokenHash !== hashHandoverToken(token) ||
        where.status !== handoverStatus ||
        expiresAt <= where.expiresAt.gt
      ) {
        return { count: 0 };
      }
      handoverStatus = "QR_SCANNED";
      return { count: 1 };
    },
    findUniqueOrThrow: async () => ({ id: "handover" }),
  },
  auditLog: {
    create: async ({ data }: { data: { action: string } }) => { audits.push(data.action); },
  },
  notification: {
    create: async ({ data }: { data: { userId: string; type: string } }) => {
      notifications.push(data);
    },
  },
};

const load = createRequire(__filename);
const sessionPath = load.resolve("./session");
const prismaPath = load.resolve("./prisma");
const handoverPath = load.resolve("./handover");
load(sessionPath);
load(prismaPath);
const originalSession = load.cache[sessionPath]!.exports;
const originalPrisma = load.cache[prismaPath]!.exports;
load.cache[sessionPath]!.exports = { getSession: async () => actor };
load.cache[prismaPath]!.exports = {
  prisma: {
    rental: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        where.id === rental.id ? rental : null,
    },
    $queryRaw: async () => [{ attempts: ++attempts }],
    $transaction: async (callback: (tx: typeof transaction) => Promise<void>) => callback(transaction),
  },
};

const { verifyHandover } = load("./handover") as typeof import("./handover");

after(() => {
  load.cache[sessionPath]!.exports = originalSession;
  load.cache[prismaPath]!.exports = originalPrisma;
  delete load.cache[handoverPath];
});

function reset() {
  actor = { userId: "renter", role: "RENTER" };
  bookingStatus = "APPROVED";
  handoverStatus = "INITIATED";
  expiresAt = new Date(Date.now() + 60_000);
  attempts = 0;
  notifications.length = 0;
  audits.length = 0;
}

test("the booked renter can scan once and the owner is notified", async () => {
  reset();
  await verifyHandover("booking", "COLLECTION", token);
  assert.equal(handoverStatus, "QR_SCANNED");
  assert.equal(bookingStatus, "APPROVED");
  assert.deepEqual(audits, ["COLLECTION_QR_SCANNED"]);
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].userId, "owner");
  assert.equal(notifications[0].type, "COLLECTION_QR_SCANNED");
  await assert.rejects(verifyHandover("booking", "COLLECTION", token), /already used/);
  assert.equal(notifications.length, 1);
});

test("rejects another renter, a wrong booking, expired and invalid codes", async () => {
  reset();
  actor.userId = "other-renter";
  await assert.rejects(verifyHandover("booking", "COLLECTION", token), /not authorized/);
  assert.equal(attempts, 0);

  actor.userId = "renter";
  await assert.rejects(verifyHandover("other-booking", "COLLECTION", token), /not authorized/);
  await assert.rejects(verifyHandover("booking", "COLLECTION", "b".repeat(64)), /invalid, expired or already used/);
  expiresAt = new Date(Date.now() - 1);
  await assert.rejects(verifyHandover("booking", "COLLECTION", token), /invalid, expired or already used/);
  await assert.rejects(verifyHandover("booking", "COLLECTION", "wrong"), /Invalid QR code/);
  assert.equal(handoverStatus, "INITIATED");
  assert.equal(notifications.length, 0);
});

test("rejects collection scans when the booking is no longer approved", async () => {
  reset();
  bookingStatus = "CANCELLED";
  await assert.rejects(verifyHandover("booking", "COLLECTION", token), /not eligible/);
  assert.equal(handoverStatus, "INITIATED");
  assert.equal(notifications.length, 0);
});

test("limits repeated verification attempts", async () => {
  reset();
  attempts = 10;
  await assert.rejects(verifyHandover("booking", "COLLECTION", token), /Too many verification attempts/);
  assert.equal(handoverStatus, "INITIATED");
  assert.equal(notifications.length, 0);
});
