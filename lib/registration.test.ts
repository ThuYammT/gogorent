import assert from "node:assert/strict";
import test from "node:test";

import { registrationSchema } from "./registration";

const valid = {
  role: "RENTER",
  name: "  Example User  ",
  email: "  User@Example.com  ",
  password: "password123",
  confirmPassword: "password123",
};

test("registration normalizes account details and accepts both public roles", () => {
  const parsed = registrationSchema.parse(valid);
  assert.equal(parsed.name, "Example User");
  assert.equal(parsed.email, "user@example.com");
  assert.equal(registrationSchema.safeParse({ ...valid, role: "OWNER" }).success, true);
});

test("registration rejects invalid fields and privileged roles", () => {
  for (const invalid of [
    { role: "ADMIN" },
    { name: "  " },
    { email: "not-an-email" },
    { password: "short", confirmPassword: "short" },
    { confirmPassword: "different" },
    { password: "a".repeat(73), confirmPassword: "a".repeat(73) },
    { password: "😀".repeat(19), confirmPassword: "😀".repeat(19) },
  ]) {
    assert.equal(registrationSchema.safeParse({ ...valid, ...invalid }).success, false);
  }
});

test("registration accepts bcrypt's 72-byte password limit", () => {
  const password = "😀".repeat(18);
  assert.equal(registrationSchema.safeParse({ ...valid, password, confirmPassword: password }).success, true);
});
