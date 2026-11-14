import { createHash, randomBytes } from "node:crypto";

export const HANDOVER_TOKEN_LIFETIME_MS = 5 * 60 * 1000;

export function createHandoverToken(now: Date) {
  const token = randomBytes(32).toString("hex");
  return {
    token,
    tokenHash: hashHandoverToken(token),
    expiresAt: new Date(now.getTime() + HANDOVER_TOKEN_LIFETIME_MS),
  };
}

export function hashHandoverToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isHandoverTokenFormat(token: string): boolean {
  return /^[a-f0-9]{64}$/.test(token);
}
