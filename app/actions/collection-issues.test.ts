import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, test } from "node:test";

const load = createRequire(__filename);
const paths = {
  issues: load.resolve("../../lib/collection-issues"),
  cache: load.resolve("next/cache"),
  action: load.resolve("./collection-issues"),
};
load(paths.issues);
load(paths.cache);
const originals = { issues: load.cache[paths.issues]!.exports, cache: load.cache[paths.cache]!.exports };
let proposals = 0;
let responses = 0;
load.cache[paths.issues]!.exports = {
  proposeCollectionIssue: async () => { proposals++; },
  respondToCollectionIssue: async () => { responses++; },
};
load.cache[paths.cache]!.exports = { revalidatePath: () => {} };
const { proposeIssue, respondToIssue } = load("./collection-issues") as typeof import("./collection-issues");

after(() => {
  load.cache[paths.issues]!.exports = originals.issues;
  load.cache[paths.cache]!.exports = originals.cache;
  delete load.cache[paths.action];
});

test("repair proposal and acceptance require each party's reinspection confirmation", async () => {
  const proposal = new FormData();
  proposal.set("outcome", "REPAIR");
  assert.ok("error" in (await proposeIssue("booking", "issue", null, proposal))!);
  assert.equal(proposals, 0);
  proposal.set("inspected", "confirmed");
  assert.deepEqual(await proposeIssue("booking", "issue", null, proposal), { success: true });

  const response = new FormData();
  response.set("outcome", "REPAIR");
  response.set("proposedAt", new Date().toISOString());
  response.set("response", "accept");
  assert.ok("error" in (await respondToIssue("booking", "issue", null, response))!);
  assert.equal(responses, 0);
  response.set("inspected", "confirmed");
  assert.deepEqual(await respondToIssue("booking", "issue", null, response), { success: true });
  assert.equal(responses, 1);
});
