import assert from "node:assert/strict";
import test from "node:test";

import {
  createHandoverToken,
  hashHandoverToken,
  isHandoverTokenFormat,
} from "./handover-tokens";

test("generates unique random tokens with a five-minute expiry", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const first = createHandoverToken(now);
  const second = createHandoverToken(now);

  assert.notEqual(first.token, second.token);
  assert.ok(isHandoverTokenFormat(first.token));
  assert.equal(first.expiresAt.toISOString(), "2026-01-01T00:05:00.000Z");
  assert.equal(first.tokenHash, hashHandoverToken(first.token));
  assert.notEqual(first.tokenHash, first.token);
});

test("rejects malformed or oversized scanned tokens", () => {
  for (const token of ["", "a".repeat(63), "g".repeat(64), "a".repeat(65)]) {
    assert.equal(isHandoverTokenFormat(token), false);
  }
});
