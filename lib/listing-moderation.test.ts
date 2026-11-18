import assert from "node:assert/strict";
import test from "node:test";
import type { Prisma } from "./generated/prisma/client";
import { removeMarketplaceListing } from "./listing-moderation";

function fixture(status = "AVAILABLE", booking = false, replacement = false) {
  const writes: { status?: string; notification?: Record<string, unknown>; audit?: Record<string, unknown> } = {};
  const tx = {
    $queryRaw: async () => [],
    device: {
      findUnique: async () => status === "MISSING" ? null : { id: "device", ownerId: "owner", name: "Camera", status },
      update: async ({ data }: { data: { status: string } }) => { writes.status = data.status; },
    },
    rental: { findFirst: async () => booking ? { id: "booking" } : null },
    collectionIssue: { findFirst: async () => replacement ? { id: "issue" } : null },
    notification: { create: async ({ data }: { data: Record<string, unknown> }) => { writes.notification = data; } },
    auditLog: { create: async ({ data }: { data: Record<string, unknown> }) => { writes.audit = data; } },
  };
  return { tx: tx as unknown as Prisma.TransactionClient, writes };
}
const input = { deviceId: "device", adminId: "admin", reason: "  Missing required details.  " };

test("admin removal rejects pending and approved items, notifies the owner, and retains history", async () => {
  for (const status of ["PENDING_APPROVAL", "AVAILABLE", "UNAVAILABLE"]) {
    const { tx, writes } = fixture(status);
    await removeMarketplaceListing(tx, input);
    assert.equal(writes.status, "REJECTED");
    assert.equal(writes.notification!.userId, "owner");
    assert.equal(writes.notification!.deviceId, "device");
    assert.match(String(writes.notification!.message), /Missing required details\./);
    assert.equal(writes.audit!.userId, "admin");
    assert.deepEqual(JSON.parse(String(writes.audit!.details)), { previousStatus: status, status: "REJECTED", reason: "Missing required details." });
  }
});

test("removal refuses missing, already rejected, rented, booked, or proposed replacement items", async () => {
  for (const [status, booking, replacement] of [
    ["MISSING", false, false], ["REJECTED", false, false], ["RENTED", false, false],
    ["AVAILABLE", true, false], ["AVAILABLE", false, true],
  ] as const) {
    const { tx, writes } = fixture(status, booking, replacement);
    await assert.rejects(removeMarketplaceListing(tx, input));
    assert.deepEqual(writes, {});
  }
});

test("removal requires a bounded nonempty owner-facing reason", async () => {
  for (const reason of ["", "   ", "x".repeat(1001)]) {
    const { tx, writes } = fixture();
    await assert.rejects(removeMarketplaceListing(tx, { ...input, reason }), /Provide a reason/);
    assert.deepEqual(writes, {});
  }
});
