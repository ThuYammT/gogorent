import { createHash, randomBytes } from "node:crypto";

export function newSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string): string | null {
  if (!/^[a-f0-9]{64}$/.test(token)) {
    return null;
  }

  return createHash("sha256").update(token).digest("hex");
}
