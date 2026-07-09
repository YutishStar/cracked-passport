"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, currentUserEmail } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { generateClaimToken } from "@/lib/claim-tokens";
import { sendAcceptanceEmail, claimUrl } from "@/lib/email";
import { createIssuer } from "@/lib/passport/issuer";
import { getFellowById } from "@/lib/supabase/queries/fellows";

export async function approveApplication(applicationId: string) {
  await requireAdmin();
  const reviewer = (await currentUserEmail()) ?? "admin";
  const { token, tokenHash, expiresAt } = generateClaimToken();

  const { data, error } = await supabaseAdmin().rpc("approve_application", {
    p_app_id: applicationId,
    p_reviewer: reviewer,
    p_token_hash: tokenHash,
    p_expires: expiresAt,
  });
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  const fellowId = row?.fellow_id as string;
  const fellowNumber = row?.fellow_number as number;

  // Load applicant email to send the claim link.
  const fellow = await getFellowById(fellowId);
  const url = claimUrl(token);
  const emailed = fellow
    ? await sendAcceptanceEmail({
        to: fellow.email,
        fellowNumber,
        claimUrl: url,
      })
    : false;

  revalidatePath("/admin/applications");
  revalidatePath("/admin/fellows");
  // Return the claim URL so admin can copy it if email didn't send.
  return { fellowNumber, claimUrl: url, emailed };
}

export async function rejectApplication(applicationId: string) {
  await requireAdmin();
  const reviewer = (await currentUserEmail()) ?? "admin";
  const { error } = await supabaseAdmin()
    .from("applications")
    .update({ status: "rejected", reviewed_at: new Date().toISOString(), reviewed_by: reviewer })
    .eq("id", applicationId);
  if (error) throw error;
  revalidatePath("/admin/applications");
}

export async function resendClaimEmail(fellowId: string) {
  await requireAdmin();
  const fellow = await getFellowById(fellowId);
  if (!fellow) throw new Error("fellow not found");
  const { token, tokenHash, expiresAt } = generateClaimToken();
  // Invalidate old unused tokens, issue a fresh one.
  await supabaseAdmin()
    .from("claim_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("fellow_id", fellowId)
    .is("used_at", null);
  await supabaseAdmin()
    .from("claim_tokens")
    .insert({ fellow_id: fellowId, token_hash: tokenHash, expires_at: expiresAt });
  const url = claimUrl(token);
  const emailed = await sendAcceptanceEmail({
    to: fellow.email,
    fellowNumber: fellow.fellow_number,
    claimUrl: url,
  });
  return { claimUrl: url, emailed };
}

async function addTimelineEvent(
  fellowId: string,
  kind: "stamp" | "achievement" | "perk" | "house_arrival" | "custom",
  title: string,
  refId?: string,
) {
  await supabaseAdmin().from("timeline_events").insert({
    fellow_id: fellowId,
    kind,
    title,
    ref_id: refId ?? null,
  });
}

export async function issueStamp(fellowId: string, stampTypeId: string, note?: string) {
  await requireAdmin();
  const { data: stamp, error } = await supabaseAdmin()
    .from("fellow_stamps")
    .upsert(
      { fellow_id: fellowId, stamp_type_id: stampTypeId, note: note ?? null },
      { onConflict: "fellow_id,stamp_type_id", ignoreDuplicates: true },
    )
    .select("id, stamp_types(name)")
    .maybeSingle();
  if (error) throw error;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const name = (stamp as any)?.stamp_types?.name ?? "House";
  await addTimelineEvent(fellowId, "stamp", name);
  await createIssuer().refreshMetadata(fellowId);
  revalidatePath(`/admin/fellows/${fellowId}`);
}

export async function issueAchievement(
  fellowId: string,
  achievementTypeId: string,
  note?: string,
) {
  await requireAdmin();
  const { data, error } = await supabaseAdmin()
    .from("fellow_achievements")
    .upsert(
      { fellow_id: fellowId, achievement_type_id: achievementTypeId, note: note ?? null },
      { onConflict: "fellow_id,achievement_type_id", ignoreDuplicates: true },
    )
    .select("id, achievement_types(name)")
    .maybeSingle();
  if (error) throw error;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const name = (data as any)?.achievement_types?.name ?? "Achievement";
  await addTimelineEvent(fellowId, "achievement", name);
  await createIssuer().refreshMetadata(fellowId);
  revalidatePath(`/admin/fellows/${fellowId}`);
}

export async function assignPerk(fellowId: string, perkId: string) {
  await requireAdmin();
  const { data, error } = await supabaseAdmin()
    .from("fellow_perks")
    .upsert(
      { fellow_id: fellowId, perk_id: perkId },
      { onConflict: "fellow_id,perk_id", ignoreDuplicates: true },
    )
    .select("id, perks(name)")
    .maybeSingle();
  if (error) throw error;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const name = (data as any)?.perks?.name ?? "Perk";
  await addTimelineEvent(fellowId, "perk", name);
  revalidatePath(`/admin/fellows/${fellowId}`);
}

export async function setResidency(
  fellowId: string,
  houseId: string,
  arrivedOn: string,
) {
  await requireAdmin();
  const { error } = await supabaseAdmin()
    .from("house_residencies")
    .upsert(
      { fellow_id: fellowId, house_id: houseId, arrived_on: arrivedOn },
      { onConflict: "fellow_id,house_id,arrived_on", ignoreDuplicates: true },
    );
  if (error) throw error;
  // Make it the current house.
  await supabaseAdmin().from("fellows").update({ current_house_id: houseId }).eq("id", fellowId);
  const { data: house } = await supabaseAdmin()
    .from("houses")
    .select("name")
    .eq("id", houseId)
    .maybeSingle();
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  await addTimelineEvent(fellowId, "house_arrival", (house as any)?.name ?? "New house");
  revalidatePath(`/admin/fellows/${fellowId}`);
}

export async function retryIssuance(fellowId: string) {
  await requireAdmin();
  const fellow = await getFellowById(fellowId);
  if (!fellow) throw new Error("fellow not found");
  const { data: wallet } = await supabaseAdmin()
    .from("wallets")
    .select("address")
    .eq("fellow_id", fellowId)
    .maybeSingle();
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const addr = (wallet as any)?.address ?? null;
  await createIssuer().issuePassport({
    fellowId,
    fellowNumber: fellow.fellow_number,
    toAddress: addr,
  });
  revalidatePath(`/admin/fellows/${fellowId}`);
}
