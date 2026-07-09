"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { hashClaimToken } from "@/lib/claim-tokens";
import { validateUsername } from "@/lib/usernames";

export type CompleteClaimResult =
  | { ok: true; fellowNumber: number }
  | { ok: false; error: string };

/**
 * Binds the signed-in Clerk user to the fellow behind the claim token, sets the
 * username, and marks the token used — all atomically in complete_claim().
 */
export async function completeClaim(
  rawToken: string,
  usernameInput: string,
): Promise<CompleteClaimResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Please sign in first." };

  const check = validateUsername(usernameInput);
  if (!check.ok) return { ok: false, error: check.reason };

  const { data, error } = await supabaseAdmin().rpc("complete_claim", {
    p_token_hash: hashClaimToken(rawToken),
    p_clerk_user: userId,
    p_username: check.value,
  });

  if (error) {
    const msg = error.message || "";
    if (msg.includes("username_taken"))
      return { ok: false, error: "That handle is taken. Try another." };
    if (msg.includes("clerk_user_taken"))
      return { ok: false, error: "This account already has a Passport." };
    if (msg.includes("token_used"))
      return { ok: false, error: "This claim link was already used." };
    if (msg.includes("token_expired"))
      return { ok: false, error: "This claim link has expired." };
    if (msg.includes("invalid_token"))
      return { ok: false, error: "This claim link is invalid." };
    return { ok: false, error: "Something went wrong. Try again." };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return { ok: true, fellowNumber: row?.fellow_number as number };
}
