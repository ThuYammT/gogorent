import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, beforeEach, test } from "node:test";

let actor = { userId: "renter", role: "RENTER" };
let issue: {
  id: string; deviceId: string; status: string; proposedOutcome: string | null;
  replacementDeviceId: string | null; proposedAt: Date | null; paymentReviewRequired: boolean;
} | null;
let rental: { id: string; renterId: string; ownerId: string; deviceId: string; status: string; totalAmount: string };
let replacementAvailable: boolean;
let hasPayment: boolean;
let resetHandover: Record<string, unknown> | null;
let notifications: { userId: string; type: string }[];

const tx = {
  $queryRaw: async () => [],
  rental: {
    findUnique: async () => rental,
    update: async ({ data }: { data: Partial<typeof rental> }) => { Object.assign(rental, data); },
  },
  collectionIssue: {
    findFirst: async () => issue,
    create: async ({ data }: { data: { id: string; deviceId: string } }) => {
      issue = { id: data.id, deviceId: data.deviceId, status: "OPEN", proposedOutcome: null,
        replacementDeviceId: null, proposedAt: null, paymentReviewRequired: false };
    },
    update: async ({ data }: { data: Partial<NonNullable<typeof issue>> }) => { Object.assign(issue!, data); },
  },
  device: {
    findFirst: async ({ where }: { where: { ownerId: string; id: string } }) =>
      replacementAvailable && where.ownerId === "owner" && where.id === "replacement" ? { id: where.id } : null,
    updateMany: async ({ where }: { where: { ownerId: string; id: string } }) => {
      if (!replacementAvailable || where.ownerId !== "owner" || where.id !== "replacement") return { count: 0 };
      replacementAvailable = false;
      return { count: 1 };
    },
  },
  handover: {
    updateMany: async ({ data }: { data: Record<string, unknown> }) => { resetHandover = data; },
  },
  transaction: { findFirst: async () => hasPayment ? { id: "payment" } : null },
  user: { findMany: async () => [{ id: "admin" }] },
  notification: {
    create: async ({ data }: { data: { userId: string; type: string } }) => { notifications.push(data); },
    createMany: async ({ data }: { data: { userId: string; type: string }[] }) => { notifications.push(...data); },
  },
  auditLog: { create: async () => {} },
};

const load = createRequire(__filename);
const sessionPath = load.resolve("./session");
const prismaPath = load.resolve("./prisma");
const issuesPath = load.resolve("./collection-issues");
load(sessionPath);
load(prismaPath);
const originalSession = load.cache[sessionPath]!.exports;
const originalPrisma = load.cache[prismaPath]!.exports;
load.cache[sessionPath]!.exports = { getSession: async () => actor };
load.cache[prismaPath]!.exports = { prisma: { $transaction: async (fn: (value: typeof tx) => Promise<void>) => fn(tx) } };
const { reportCollectionIssue, proposeCollectionIssue, respondToCollectionIssue } =
  load("./collection-issues") as typeof import("./collection-issues");

after(() => {
  load.cache[sessionPath]!.exports = originalSession;
  load.cache[prismaPath]!.exports = originalPrisma;
  delete load.cache[issuesPath];
});

beforeEach(() => {
  actor = { userId: "renter", role: "RENTER" };
  rental = { id: "booking", renterId: "renter", ownerId: "owner", deviceId: "faulty", status: "APPROVED", totalAmount: "1250" };
  issue = null;
  replacementAvailable = true;
  hasPayment = false;
  resetHandover = null;
  notifications = [];
});

async function report() {
  await reportCollectionIssue({ id: "issue", rentalId: "booking", category: "POWER", description: "Does not charge", evidence: [] });
}

async function propose(outcome: "REPLACE" | "REPAIR" | "CANCEL", replacement: string | null = null) {
  actor = { userId: "owner", role: "OWNER" };
  await proposeCollectionIssue("booking", "issue", outcome, replacement);
  actor = { userId: "renter", role: "RENTER" };
}

function respond(outcome: "REPLACE" | "REPAIR" | "CANCEL", accept: boolean, replacement: string | null = null) {
  return respondToCollectionIssue("booking", "issue", outcome, issue!.proposedAt!.toISOString(), replacement, accept);
}

test("only the booked renter can report, and only one issue may remain open", async () => {
  actor = { userId: "other", role: "RENTER" };
  await assert.rejects(report(), /not available/);
  actor = { userId: "renter", role: "RENTER" };
  await report();
  assert.equal(notifications[0].userId, "owner");
  await assert.rejects(report(), /already has an unresolved/);
});

test("proposals require the owner and a same-owner available replacement", async () => {
  await report();
  await assert.rejects(proposeCollectionIssue("booking", "issue", "CANCEL", null), /authorized/);
  actor = { userId: "owner", role: "OWNER" };
  await assert.rejects(proposeCollectionIssue("booking", "issue", "REPLACE", "other"), /not available/);
});

test("declining reopens the issue and a stale proposal cannot be accepted", async () => {
  await report();
  await propose("REPAIR");
  await assert.rejects(respondToCollectionIssue("booking", "issue", "CANCEL", issue!.proposedAt!.toISOString(), null, true), /proposal has changed/i);
  await respond("REPAIR", false);
  assert.equal(issue!.status, "OPEN");
  assert.equal(rental.status, "APPROVED");
});

test("replacement is reserved only on acceptance and requires a fresh QR", async () => {
  await report();
  await propose("REPLACE", "replacement");
  assert.equal(replacementAvailable, true);
  replacementAvailable = false;
  await assert.rejects(respond("REPLACE", true, "replacement"), /no longer available/);
  assert.equal(rental.deviceId, "faulty");
  replacementAvailable = true;
  await respond("REPLACE", true, "replacement");
  assert.equal(rental.deviceId, "replacement");
  assert.equal(rental.totalAmount, "1250");
  assert.equal(issue!.deviceId, "faulty");
  assert.equal(issue!.status, "RESOLVED");
  assert.equal(resetHandover!.status, "INITIATED");
  assert.equal(resetHandover!.scannedAt, null);
  assert.equal((resetHandover!.expiresAt as Date).getTime(), 0);
});

test("agreed cancellation flags transactions and notifies admins without changing them", async () => {
  await report();
  await propose("CANCEL");
  hasPayment = true;
  await respond("CANCEL", true);
  assert.equal(rental.status, "CANCELLED");
  assert.equal(issue!.paymentReviewRequired, true);
  assert.ok(notifications.some((n) => n.userId === "admin" && n.type === "COLLECTION_ISSUE_PAYMENT_REVIEW"));
});
