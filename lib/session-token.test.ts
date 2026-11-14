import assert from "node:assert/strict";
import test from "node:test";

import { hashSessionToken, newSessionToken } from "./session-token";

test("session tokens are random and only their hash is persisted", () => {
  const token = newSessionToken();
  const another = newSessionToken();
  assert.match(token, /^[a-f0-9]{64}$/);
  assert.notEqual(token, another);
  assert.match(hashSessionToken(token) ?? "", /^[a-f0-9]{64}$/);
  assert.notEqual(hashSessionToken(token), token);
});

test("old JSON session cookies and invalid tokens cannot authenticate", () => {
  assert.equal(hashSessionToken('{"userId":"admin","role":"ADMIN"}'), null);
  assert.equal(hashSessionToken("a".repeat(63)), null);
  assert.equal(hashSessionToken("g".repeat(64)), null);
});
