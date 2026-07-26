import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { getWalletSession } from "@/lib/wallet-session";
import { DEMO_MODE } from "@/lib/demo";
import type { Fellow } from "@/lib/supabase/types";

/**
 * Primary (verified) email of the signed-in user, lowercased. Null if signed
 * out. Deliberately NOT demo-bypassed — admin identity always requires a
 * real Clerk session, even when DEMO_MODE has opened up the fellow-facing
 * flows for frictionless public demos.
 */
export async function currentUserEmail(): Promise<string | null> {
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  return email ? email.toLowerCase() : null;
}

/** Deliberately NOT demo-bypassed — see currentUserEmail. */
export async function isAdmin(): Promise<boolean> {
  const email = await currentUserEmail();
  return !!email && env.adminEmails.includes(email);
}

/** Throws if the caller is not an admin. Use inside every admin action. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error("Not authorized");
  }
}

/**
 * The signed-in fellow, however they got in: a Clerk session (email, used for
 * applying and the first onboarding pass) or a wallet session (Sign in with
 * Core — how a returning Fellow opens their Passport with nothing but their
 * wallet). Clerk is checked first since it's also how admin is identified.
 */
export async function getCurrentFellow(): Promise<Fellow | null> {
  if (DEMO_MODE) {
    // No real session to key off of — "you" are whichever demo fellow
    // claimed most recently (each claim gets its own fake clerk_user_id,
    // see demoUserIdForToken).
    const { data } = await supabaseAdmin()
      .from("fellows")
      .select("*")
      .like("clerk_user_id", "demo-%")
      .order("claimed_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    return (data as Fellow | null) ?? null;
  }

  const { userId } = await auth();
  if (userId) {
    const { data } = await supabaseAdmin()
      .from("fellows")
      .select("*")
      .eq("clerk_user_id", userId)
      .maybeSingle();
    if (data) return data as Fellow;
  }

  const wallet = await getWalletSession();
  if (wallet) {
    const { data } = await supabaseAdmin()
      .from("fellows")
      .select("*")
      .eq("id", wallet.fellowId)
      .maybeSingle();
    return (data as Fellow | null) ?? null;
  }

  return null;
}

/** True if the current session is a wallet session (Signed in with Core). */
export async function isWalletSession(): Promise<boolean> {
  if (DEMO_MODE) return false;
  const { userId } = await auth();
  if (userId) return false;
  return !!(await getWalletSession());
}

/** Throws if there is no signed-in fellow. Returns the fellow otherwise. */
export async function requireFellow(): Promise<Fellow> {
  const fellow = await getCurrentFellow();
  if (!fellow) throw new Error("Not a fellow");
  return fellow;
}
