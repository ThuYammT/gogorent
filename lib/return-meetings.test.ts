import assert from "node:assert/strict";
import test from "node:test";
import type { Prisma } from "./generated/prisma/client";
import { updateReturnMeeting } from "./return-meetings";

function fixture(status = "ACTIVE", handoverStatus: string | null = null, renterId = "renter") {
  const writes: { rental?: Record<string, unknown>; expiresAt?: Date; owner?: string; audit?: string } = {};
  const tx = {
    $queryRaw: async () => [],
    rental: {
      findUnique: async () => ({ id: "booking", renterId, ownerId: "owner", status, endDate: new Date("2026-11-20T00:00:00Z"), pickedUpAt: new Date("2026-11-19T03:00:00Z") }),
      update: async ({ data }: { data: Record<string, unknown> }) => { writes.rental = data; },
    },
    handover: {
      findUnique: async () => handoverStatus ? { status: handoverStatus } : null,
      updateMany: async ({ data }: { data: { expiresAt: Date } }) => { writes.expiresAt = data.expiresAt; },
    },
    notification: { create: async ({ data }: { data: { userId: string } }) => { writes.owner = data.userId; } },
    auditLog: { create: async ({ data }: { data: { action: string } }) => { writes.audit = data.action; } },
  };
  return { tx: tx as unknown as Prisma.TransactionClient, writes };
}
function form() {
  const data = new FormData();
  for (const [key, value] of Object.entries({ returnTime: "15:00", returnLocation: "University entrance", returnLatitude: "13.75", returnLongitude: "100.5" })) data.set(key, value);
  return data;
}
const now = new Date("2026-11-19T04:00:00Z");
test("return plan is stored, notifies the owner, and expires any previous unscanned QR", async () => {
  const { tx, writes } = fixture("ACTIVE", "INITIATED");
  await updateReturnMeeting(tx, "booking", "renter", form(), now);
  assert.equal(writes.rental!.returnTime, "15:00");
  assert.equal(writes.rental!.returnLocation, "University entrance");
  assert.equal(writes.owner, "owner");
  assert.equal(writes.expiresAt!.getTime(), 0);
  assert.equal(writes.audit, "RETURN_MEETING_UPDATED");
});
test("another renter and bookings before pickup or after return cannot change the meeting", async () => {
  for (const [status, renterId] of [["ACTIVE", "other"], ["APPROVED", "renter"], ["RETURNED", "renter"], ["CANCELLED", "renter"], ["COMPLETED", "renter"]]) {
    const { tx, writes } = fixture(status, null, renterId);
    await assert.rejects(updateReturnMeeting(tx, "booking", "renter", form(), now), /Only this booking/);
    assert.deepEqual(writes, {});
  }
});
test("a scanned return QR freezes the meeting plan", async () => {
  for (const status of ["QR_SCANNED", "VERIFIED"]) {
    const { tx, writes } = fixture("ACTIVE", status);
    await assert.rejects(updateReturnMeeting(tx, "booking", "renter", form(), now), /already in progress/);
    assert.deepEqual(writes, {});
  }
});
test("the booking's end date is authoritative; a forged return date cannot extend the rental", async () => {
  const { tx, writes } = fixture();
  const data = form(); data.set("returnDate", "2099-01-01");
  await assert.rejects(updateReturnMeeting(tx, "booking", "renter", data, new Date("2026-11-21T00:00:00Z")), /future/);
  assert.deepEqual(writes, {});
});
