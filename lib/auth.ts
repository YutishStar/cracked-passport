import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import type { Fellow } from "@/lib/supabase/types";

/** Primary (verified) email of the signed-in user, lowercased. Null if signed out. */
export async function currentUserEmail(): Promise<string | null> {
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  return email ? email.toLowerCase() : null;
}

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

/** The fellow row bound to the signed-in Clerk user, or null. */
export async function getCurrentFellow(): Promise<Fellow | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const { data } = await supabaseAdmin()
    .from("fellows")
    .select("*")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  return (data as Fellow | null) ?? null;
}

/** Throws if there is no signed-in fellow. Returns the fellow otherwise. */
export async function requireFellow(): Promise<Fellow> {
  const fellow = await getCurrentFellow();
  if (!fellow) throw new Error("Not a fellow");
  return fellow;
}
