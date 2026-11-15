import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, test } from "node:test";

let actor = { userId: "renter", role: "RENTER" };
let rentalStatus = "APPROVED";
let handoverStatus = "QR_SCANNED";
let scannedAt: Date | null = new Date();
let hasPayment = false;
let deviceStatus = "UNAVAILABLE";
let deviceCondition = "GOOD";
let pickedUpAt: Date | undefined;
let renterConfirmedAt: Date | undefined;
const payments: { type: string; amount: string; status: string }[] = [];
const notifications: { userId: string; type: string }[] = [];
const audits: { action: string; details: string }[] = [];

const rental = {
  id: "booking",
  renterId: "renter",
  ownerId: "owner",
  deviceId: "device",
  totalAmount: "1250.00",
};
const tx = {
  $queryRaw: async () => [],
  rental: {
    findUnique: async ({ where }: { where: { id: string } }) =>
      where.id === rental.id ? { ...rental, status: rentalStatus } : null,
    update: async ({ data }: { data: { status: string; pickedUpAt: Date } }) => {
      rentalStatus = data.status;
      pickedUpAt = data.pickedUpAt;
    },
  },
  handover: {
    findUnique: async () => ({ id: "handover", status: handoverStatus, scannedAt }),
    update: async ({ data }: { data: { status: string; renterConfirmedAt: Date } }) => {
      handoverStatus = data.status;
      renterConfirmedAt = data.renterConfirmedAt;
    },
  },
  device: {
    findUnique: async () => ({ ownerId: "owner", condition: deviceCondition, status: deviceStatus }),
    update: async ({ data }: { data: { status: string } }) => { deviceStatus = data.status; },
  },
  transaction: {
    findFirst: async () => hasPayment ? { id: "payment" } : null,
    create: async ({ data }: { data: { type: string; amount: string; status: string } }) => {
      payments.push(data);
      hasPayment = true;
    },
  },
  auditLog: {
    create: async ({ data }: { data: { action: string; details: string } }) => { audits.push(data); },
  },
  notification: {
    create: async ({ data }: { data: { userId: string; type: string } }) => { notifications.push(data); },
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
    $transaction: async (callback: (transaction: typeof tx) => Promise<void>) => callback(tx),
  },
};
const { confirmCollection } = load("./handover") as typeof import("./handover");

after(() => {
  load.cache[sessionPath]!.exports = originalSession;
  load.cache[prismaPath]!.exports = originalPrisma;
  delete load.cache[handoverPath];
});

function reset() {
  actor = { userId: "renter", role: "RENTER" };
  rentalStatus = "APPROVED";
  handoverStatus = "QR_SCANNED";
  scannedAt = new Date();
  hasPayment = false;
  deviceStatus = "UNAVAILABLE";
  deviceCondition = "GOOD";
  pickedUpAt = undefined;
  renterConfirmedAt = undefined;
  payments.length = 0;
  notifications.length = 0;
  audits.length = 0;
}

test("renter confirmation activates the rental and creates one pending total payment", async () => {
  reset();
  await confirmCollection("booking", "GOOD");
  assert.equal(handoverStatus, "VERIFIED");
  assert.equal(rentalStatus, "ACTIVE");
  assert.equal(deviceStatus, "RENTED");
  assert.ok(pickedUpAt instanceof Date);
  assert.equal(renterConfirmedAt, pickedUpAt);
  assert.equal(payments.length, 1);
  assert.equal(payments[0].type, "RENTAL_PAYMENT");
  assert.equal(payments[0].amount, "1250.00");
  assert.equal(payments[0].status, "PENDING");
  assert.equal(audits[0].action, "COLLECTION_CONFIRMED");
  assert.deepEqual(JSON.parse(audits[0].details), { condition: "GOOD", received: true });
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].userId, "owner");
  assert.equal(notifications[0].type, "COLLECTION_CONFIRMED");

  await assert.rejects(confirmCollection("booking", "GOOD"), /not awaiting collection confirmation/);
  assert.equal(payments.length, 1);
});

test("only the booked renter can confirm an approved, scanned collection", async () => {
  reset();
  actor.userId = "other-renter";
  await assert.rejects(confirmCollection("booking", "GOOD"), /not authorized/);
  actor = { userId: "renter", role: "OWNER" };
  await assert.rejects(confirmCollection("booking", "GOOD"), /not authorized/);
  actor.role = "RENTER";
  rentalStatus = "CANCELLED";
  await assert.rejects(confirmCollection("booking", "GOOD"), /not awaiting collection confirmation/);
  rentalStatus = "APPROVED";
  handoverStatus = "INITIATED";
  await assert.rejects(confirmCollection("booking", "GOOD"), /Scan the collection QR/);
  handoverStatus = "QR_SCANNED";
  scannedAt = null;
  await assert.rejects(confirmCollection("booking", "GOOD"), /Scan the collection QR/);
  assert.equal(payments.length, 0);
  assert.equal(notifications.length, 0);
  assert.equal(deviceStatus, "UNAVAILABLE");
});

test("does not create another payment when a payment record already exists", async () => {
  reset();
  hasPayment = true;
  await assert.rejects(confirmCollection("booking", "GOOD"), /payment record already exists/);
  assert.equal(rentalStatus, "APPROVED");
  assert.equal(handoverStatus, "QR_SCANNED");
  assert.equal(payments.length, 0);
  assert.equal(notifications.length, 0);
});

test("rejects a changed condition or a device no longer reserved for collection", async () => {
  reset();
  deviceCondition = "FAIR";
  await assert.rejects(confirmCollection("booking", "GOOD"), /condition changed/);
  deviceCondition = "GOOD";
  deviceStatus = "PENDING_APPROVAL";
  await assert.rejects(confirmCollection("booking", "GOOD"), /not available for collection/);
  assert.equal(handoverStatus, "QR_SCANNED");
  assert.equal(rentalStatus, "APPROVED");
  assert.equal(payments.length, 0);
});
