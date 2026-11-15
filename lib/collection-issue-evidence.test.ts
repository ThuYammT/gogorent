import assert from "node:assert/strict";
import { test } from "node:test";

import { MAX_EVIDENCE_SIZE, validateEvidence } from "./collection-issue-evidence";

test("accepts supported optional evidence with matching signatures", async () => {
  assert.deepEqual(await validateEvidence([]), []);
  const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], "issue.png", { type: "image/png" });
  assert.equal((await validateEvidence([png]))[0].extension, "png");
});

test("rejects excess, oversized, unsupported, or mislabeled evidence", async () => {
  const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], "issue.png", { type: "image/png" });
  await assert.rejects(validateEvidence(Array(6).fill(png)), /at most 5/);
  await assert.rejects(validateEvidence([new File([new Uint8Array(MAX_EVIDENCE_SIZE + 1)], "large.png", { type: "image/png" })]), /10 MB/);
  await assert.rejects(validateEvidence([new File(["script"], "file.html", { type: "text/html" })]), /Use JPG/);
  await assert.rejects(validateEvidence([new File(["not a png"], "file.png", { type: "image/png" })]), /does not match/);
});
