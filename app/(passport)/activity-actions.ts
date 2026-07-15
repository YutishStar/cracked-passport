"use server";

import { revalidatePath } from "next/cache";
import { requireFellow, isAdmin, currentUserEmail } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  createActivity as insertActivity,
  getActivity,
  hashClaimCode,
  activityClaimUrl,
  claimCountFor,
  hasClaimed,
} from "@/lib/supabase/queries/activities";
import { registerActivityOnChain, mintCertificate } from "@/lib/passport/certificates";
import type { ActivityKind } from "@/lib/supabase/types";

export type CreateActivityResult =
  | { ok: true; activityId: string; claimUrl: string }
  | { ok: false; error: string };

/**
 * Create a claimable activity.
 *   - Admins can create any kind (hackathon / Luma / house / activity).
 *   - Any fellow can publish a `build_post` — their daily "here's what I'm
 *     building", which others claim to show they took part.
 * Returns the claim link to share.
 */
export async function createActivityAction(input: {
  kind: ActivityKind;
  title: string;
  body?: string;
  link_url?: string;
  image_url?: string;
  max_claims?: number;
}): Promise<CreateActivityResult> {
  const fellow = await requireFellow();
  const admin = await isAdmin();

  if (input.kind !== "build_post" && !admin) {
    return { ok: false, error: "Only admins can create that kind of activity." };
  }
  if (!input.title?.trim()) {
    return { ok: false, error: "Give it a title." };
  }

  const { activity, code } = await insertActivity({
    kind: input.kind,
    title: input.title.trim(),
    body: input.body?.trim() || null,
    link_url: input.link_url?.trim() || null,
    image_url: input.image_url?.trim() || null,
    max_claims: input.max_claims ?? null,
    created_by_fellow_id: fellow.id,
    created_by: admin ? await currentUserEmail() : null,
  });

  // Register on-chain (no-op in stub mode). Failures land in chain_status and
  // never block the activity from existing.
  await registerActivityOnChain(activity);

  // The creator's own build post shows up on their Journey.
  if (input.kind === "build_post") {
    await supabaseAdmin().from("timeline_events").insert({
      fellow_id: fellow.id,
      kind: "build_post",
      title: activity.title,
      ref_id: activity.id,
    });
  }

  revalidatePath("/feed");
  revalidatePath("/passport");
  return { ok: true, activityId: activity.id, claimUrl: activityClaimUrl(activity.id, code) };
}

export type ClaimResult =
  | { ok: true; title: string; alreadyHad: boolean }
  | { ok: false; error: string };

/**
 * Claim a certificate. The fellow needs a valid claim code (from the link they
 * were given); the server mints it to them so they pay nothing.
 */
export async function claimCertificate(
  activityId: string,
  code: string,
): Promise<ClaimResult> {
  const fellow = await requireFellow();
  const activity = await getActivity(activityId);
  if (!activity) return { ok: false, error: "That activity doesn't exist." };

  if (await hasClaimed(activityId, fellow.id)) {
    return { ok: true, title: activity.title, alreadyHad: true };
  }

  if (!activity.is_open) return { ok: false, error: "Claiming has closed." };
  if (activity.closes_at && new Date(activity.closes_at) < new Date()) {
    return { ok: false, error: "Claiming has closed." };
  }
  if (activity.claim_code_hash && activity.claim_code_hash !== hashClaimCode(code)) {
    return { ok: false, error: "That claim link isn't valid." };
  }
  if (activity.max_claims != null && (await claimCountFor(activityId)) >= activity.max_claims) {
    return { ok: false, error: "All the certificates have been claimed." };
  }

  const { data, error } = await supabaseAdmin()
    .from("activity_claims")
    .insert({ activity_id: activityId, fellow_id: fellow.id })
    .select("id")
    .single();
  if (error) {
    // unique(activity_id, fellow_id) — someone double-clicked
    if ((error as { code?: string }).code === "23505") {
      return { ok: true, title: activity.title, alreadyHad: true };
    }
    return { ok: false, error: "Couldn't claim that. Try again." };
  }

  await supabaseAdmin().from("timeline_events").insert({
    fellow_id: fellow.id,
    kind: "certificate",
    title: activity.title,
    ref_id: activity.id,
  });

  // Look up their verified wallet, then mint to it (owner pays the gas).
  const { data: wallet } = await supabaseAdmin()
    .from("wallets")
    .select("address")
    .eq("fellow_id", fellow.id)
    .maybeSingle();
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const address = (wallet as any)?.address ?? null;

  await mintCertificate({
    claimId: (data as { id: string }).id,
    tokenId: activity.token_id,
    toAddress: address,
  });

  revalidatePath("/passport");
  if (fellow.username) revalidatePath(`/${fellow.username}`);
  return { ok: true, title: activity.title, alreadyHad: false };
}
