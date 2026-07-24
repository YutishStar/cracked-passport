/**
 * Demo mode — bypasses Clerk sign-in so every route is reachable without a
 * real Google session. Gated by NEXT_PUBLIC_DEMO_MODE so it can never be on
 * by accident in a real deploy.
 *
 * Each claim gets its own fake identity (derived from the claim token)
 * rather than one shared constant — `fellows.clerk_user_id` is unique, so a
 * single shared id would let only one fellow ever be claimed per session.
 * "Who am I" while browsing resolves to whichever demo fellow claimed most
 * recently (see getCurrentFellow in lib/auth.ts).
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function demoUserIdForToken(token: string): string {
  return `demo-${token.slice(0, 24)}`;
}
