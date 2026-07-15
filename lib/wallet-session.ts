import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

/**
 * Sign-in with Core wallet, for returning Fellows.
 *
 * Application still happens over email (Clerk) — that's what makes the
 * acceptance email possible. But once verified, a Fellow can come back and
 * open their Passport with nothing but their wallet: connect, sign a message,
 * done. No password, no email, no Clerk session.
 *
 * Both the nonce and the session are self-contained signed JWTs — no server
 * state, nothing to look up, works the same on serverless as anywhere else.
 */

const SESSION_COOKIE = "cracked_wallet_session";
const NONCE_TTL = "5m";
const SESSION_TTL = "30d";

function secretKey(): Uint8Array {
  const secret = process.env.WALLET_SESSION_SECRET;
  if (!secret) throw new Error("WALLET_SESSION_SECRET not set");
  return new TextEncoder().encode(secret);
}

/** A short-lived, signed nonce the wallet will sign. Nothing stored server-side. */
export async function issueNonce(): Promise<{ nonce: string; token: string }> {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const token = await new SignJWT({ nonce })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(NONCE_TTL)
    .sign(secretKey());
  return { nonce, token };
}

export function siweMessage(nonce: string): string {
  return `Sign in to Cracked Passport.\n\nThis proves you own this wallet. No transaction, no gas.\n\nNonce: ${nonce}`;
}

/** Verify the nonce token is genuine, unexpired, and matches the nonce claimed. */
export async function verifyNonce(token: string, nonce: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload.nonce === nonce;
  } catch {
    return false;
  }
}

/** Issue the signed-in session cookie for a fellow, keyed by their wallet. */
export async function createWalletSession(fellowId: string, address: string): Promise<void> {
  const token = await new SignJWT({ fellowId, address: address.toLowerCase() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(secretKey());

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export interface WalletSession {
  fellowId: string;
  address: string;
}

/** Read the current wallet session, if any. Null if signed out or invalid. */
export async function getWalletSession(): Promise<WalletSession | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return { fellowId: payload.fellowId as string, address: payload.address as string };
  } catch {
    return null;
  }
}

export async function clearWalletSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
