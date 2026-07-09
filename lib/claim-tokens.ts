import "server-only";
import { randomBytes, createHash } from "node:crypto";

const CLAIM_TTL_DAYS = 14;

/** Generate a one-time claim token: return the raw token + its sha256 hash. */
export function generateClaimToken(): {
  token: string;
  tokenHash: string;
  expiresAt: string;
} {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + CLAIM_TTL_DAYS * 86400_000);
  return {
    token,
    tokenHash: hashClaimToken(token),
    expiresAt: expires.toISOString(),
  };
}

export function hashClaimToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
