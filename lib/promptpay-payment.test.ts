import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, beforeEach, test } from "node:test";
import type { OmiseCharge } from "./omise";

let completed = false;
let updates = 0;
let notifications = 0;
let audits = 0;
const tx = {
  $queryRaw: async () => [],
  transaction: {
    findMany: async () => completed ? [{ type: "RENTAL_PAYMENT" }, { type: "DEPOSIT_HOLD" }] : [],
    updateMany: async ({ data }: { data: { status: string } }) => {
      updates++;
      completed = data.status === "COMPLETED";
      return { count: 2 };
    },
  },
  notification: { createMany: async () => { notifications++; } },
  auditLog: { create: async () => { audits++; } },
};
const load = createRequire(__filename);
const prismaPath = load.resolve("./prisma");
const paymentPath = load.resolve("./promptpay-payment");
load(prismaPath);
const original = load.cache[prismaPath]!.exports;
load.cache[prismaPath]!.exports = { prisma: {
  transaction: {
    findMany: async () => [
      { id: "rental-payment", rentalId: "booking", type: "RENTAL_PAYMENT", status: completed ? "COMPLETED" : "PENDING" },
      { id: "deposit", rentalId: "booking", type: "DEPOSIT_HOLD", status: completed ? "COMPLETED" : "PENDING" },
    ],
    updateMany: tx.transaction.updateMany,
  },
  rental: { findUnique: async () => ({ id: "booking", renterId: "renter", ownerId: "owner", rentalAmount: "1000", depositAmount: "250", totalAmount: "1250" }) },
  $transaction: async (fn: (value: typeof tx) => Promise<void>) => fn(tx),
} };
const { syncPromptPayCharge } = load("./promptpay-payment") as typeof import("./promptpay-payment");
after(() => {
  load.cache[prismaPath]!.exports = original;
  delete load.cache[paymentPath];
});
beforeEach(() => { completed = false; updates = 0; notifications = 0; audits = 0; });

function charge(overrides: Partial<OmiseCharge> = {}): OmiseCharge {
  return { id: "test-charge", amount: 125000, currency: "THB", status: "successful", paid: true, expires_at: null, failure_code: null, failure_message: null, ...overrides };
}

test("successful provider confirmation completes both payment records exactly once", async () => {
  await syncPromptPayCharge(charge());
  assert.equal(completed, true);
  assert.equal(updates, 1);
  assert.equal(notifications, 1);
  assert.equal(audits, 1);
  await syncPromptPayCharge(charge());
  assert.equal(updates, 1);
  assert.equal(notifications, 1);
  assert.equal(audits, 1);
});

test("pending and unconfirmed charges do not unlock collection", async () => {
  await syncPromptPayCharge(charge({ status: "pending", paid: false }));
  await syncPromptPayCharge(charge({ paid: false }));
  assert.equal(completed, false);
  assert.equal(updates, 0);
  assert.equal(notifications, 0);
});

test("wrong currency and amount are rejected without changing payment records", async () => {
  await assert.rejects(syncPromptPayCharge(charge({ currency: "USD" })), /currency/);
  await assert.rejects(syncPromptPayCharge(charge({ amount: 1 })), /amount does not match/);
  assert.equal(updates, 0);
});

test("failed and expired charges close pending records without confirming payment", async () => {
  for (const status of ["failed", "expired"] as const) {
    await syncPromptPayCharge(charge({ status, paid: false }));
    assert.equal(completed, false);
  }
  assert.equal(updates, 2);
  assert.equal(notifications, 0);
});
