"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { requireFellow } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createIssuer } from "@/lib/passport/issuer";
import { updateFellowProfile, type ProfileUpdate } from "@/lib/supabase/queries/fellows";
import { validateUsername } from "@/lib/usernames";
import { env } from "@/lib/env";

export type OnboardingResult =
  | { ok: true; fellowNumber: number }
  | { ok: false; error: string };

/**
 * Finish onboarding for a self-serve fellow (already bound to their Clerk
 * account at approval): set their handle and flip to claimed. No claim token.
 */
export async function completeOnboarding(usernameInput: string): Promise<OnboardingResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Please sign in first." };

  const check = validateUsername(usernameInput);
  if (!check.ok) return { ok: false, error: check.reason };

  const { data, error } = await supabaseAdmin().rpc("complete_onboarding", {
    p_clerk_user: userId,
    p_username: check.value,
  });
  if (error) {
    const msg = error.message || "";
    if (msg.includes("username_taken"))
      return { ok: false, error: "That handle is taken. Try another." };
    if (msg.includes("not_a_fellow"))
      return { ok: false, error: "You're not verified yet." };
    return { ok: false, error: "Something went wrong. Try again." };
  }
  const row = Array.isArray(data) ? data[0] : data;
  revalidatePath("/passport");
  return { ok: true, fellowNumber: row?.fellow_number as number };
}

/**
 * Records the fellow's verified address (when present) and kicks off passport
 * issuance. In stub mode `toAddress` is null and the passport is marked
 * 'deferred' — the flow still completes.
 */
export async function verifyOwnership(address: string | null) {
  const fellow = await requireFellow();

  if (address) {
    await supabaseAdmin()
      .from("wallets")
      .upsert(
        {
          fellow_id: fellow.id,
          address: address.toLowerCase(),
          chain: env.chainMode === "avalanche" ? "avalanche" : "fuji",
          verified_at: new Date().toISOString(),
        },
        { onConflict: "address", ignoreDuplicates: false },
      );
  }

  const result = await createIssuer().issuePassport({
    fellowId: fellow.id,
    fellowNumber: fellow.fellow_number,
    toAddress: address ? address.toLowerCase() : null,
  });

  revalidatePath("/passport");
  return { status: result.status };
}

export async function getPassportStatus() {
  const fellow = await requireFellow();
  const { data } = await supabaseAdmin()
    .from("passports")
    .select("status")
    .eq("fellow_id", fellow.id)
    .maybeSingle();
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return { status: (data as any)?.status ?? "pending" };
}

export async function saveProfile(patch: ProfileUpdate) {
  const fellow = await requireFellow();
  await updateFellowProfile(fellow.id, patch);
  revalidatePath("/passport");
  if (fellow.username) revalidatePath(`/${fellow.username}`);
}

/** Mark a fellow's new stamps/achievements as seen (stops the "new" animation). */
export async function markSeen() {
  const fellow = await requireFellow();
  const now = new Date().toISOString();
  await Promise.all([
    supabaseAdmin().from("fellow_stamps").update({ seen_at: now }).eq("fellow_id", fellow.id).is("seen_at", null),
    supabaseAdmin().from("fellow_achievements").update({ seen_at: now }).eq("fellow_id", fellow.id).is("seen_at", null),
  ]);
}
