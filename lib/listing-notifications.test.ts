import assert from "node:assert/strict";
import test from "node:test";

import { notifyAdminsOfNewListing } from "./listing-notifications";

test("notifies each active admin about the submitted listing", async () => {
  const queries: unknown[] = [];
  const writes: unknown[] = [];
  const transaction = {
    user: {
      async findMany(query: unknown) {
        queries.push(query);
        return [{ id: "admin-1" }, { id: "admin-2" }];
      },
    },
    notification: {
      async createMany(write: unknown) {
        writes.push(write);
      },
    },
  };

  await notifyAdminsOfNewListing(transaction, {
    id: "device-1",
    name: "Camera",
  });

  assert.deepEqual(queries, [{
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { id: true },
  }]);
  assert.deepEqual(writes, [{
    data: ["admin-1", "admin-2"].map((userId) => ({
      userId,
      deviceId: "device-1",
      type: "LISTING_SUBMITTED",
      title: "New listing awaiting approval",
      message: 'The listing "Camera" has been submitted for review.',
    })),
  }]);
});

test("does not create notifications when there are no active admins", async () => {
  let created = false;
  await notifyAdminsOfNewListing({
    user: {
      async findMany() {
        return [];
      },
    },
    notification: {
      async createMany() {
        created = true;
      },
    },
  }, { id: "device-1", name: "Camera" });

  assert.equal(created, false);
});

test("surfaces notification write failures", async () => {
  await assert.rejects(
    notifyAdminsOfNewListing({
      user: {
        async findMany() {
          return [{ id: "admin-1" }];
        },
      },
      notification: {
        async createMany() {
          throw new Error("Database unavailable");
        },
      },
    }, { id: "device-1", name: "Camera" }),
    /Database unavailable/,
  );
});
