import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, test } from "node:test";

const load = createRequire(__filename);
const sessionPath = load.resolve("../../../lib/session");
const handoverPath = load.resolve("../../../lib/handover");
const cachePath = load.resolve("next/cache");
const actionsPath = load.resolve("./actions");
load(sessionPath);
load(handoverPath);
load(cachePath);
const originalSession = load.cache[sessionPath]!.exports;
const originalHandover = load.cache[handoverPath]!.exports;
const originalCache = load.cache[cachePath]!.exports;
let confirmations = 0;
let confirmedCondition = "";
load.cache[sessionPath]!.exports = { requireRenter: async () => ({ id: "renter" }) };
load.cache[handoverPath]!.exports = {
  HandoverError: class HandoverError extends Error {},
  confirmCollection: async (_rentalId: string, condition: string) => {
    confirmations++;
    confirmedCondition = condition;
  },
};
load.cache[cachePath]!.exports = { revalidatePath: () => {} };
const { confirmCollectionReceipt } = load("./actions") as typeof import("./actions");

after(() => {
  load.cache[sessionPath]!.exports = originalSession;
  load.cache[handoverPath]!.exports = originalHandover;
  load.cache[cachePath]!.exports = originalCache;
  delete load.cache[actionsPath];
});

test("requires explicit condition and receipt confirmations on the server", async () => {
  confirmations = 0;
  const form = new FormData();
  assert.ok("error" in await confirmCollectionReceipt("booking", null, form));
  form.set("listedCondition", "GOOD");
  form.set("condition", "confirmed");
  assert.ok("error" in await confirmCollectionReceipt("booking", null, form));
  assert.equal(confirmations, 0);
  form.set("received", "confirmed");
  assert.deepEqual(await confirmCollectionReceipt("booking", null, form), { success: true });
  assert.equal(confirmations, 1);
  assert.equal(confirmedCondition, "GOOD");
});
