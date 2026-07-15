import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import type { Activity, ActivityKind } from "@/lib/supabase/types";

/* ---------------- claim codes ----------------
   A claim link carries a secret. We store only its hash, so a leaked database
   can't be used to forge claims — same pattern as the passport claim tokens. */

export function generateClaimCode(): { code: string; hash: string } {
  const code = randomBytes(12).toString("base64url");
  return { code, hash: hashClaimCode(code) };
}
export function hashClaimCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}
export function activityClaimUrl(activityId: string, code: string): string {
  return `${env.appUrl.replace(/\/$/, "")}/c/${activityId}?k=${code}`;
}

/* ---------------- reads ---------------- */

export async function getActivity(id: string): Promise<Activity | null> {
  const { data } = await supabaseAdmin()
    .from("activities")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as Activity | null) ?? null;
}

export async function listActivities(kind?: ActivityKind): Promise<Activity[]> {
  let q = supabaseAdmin()
    .from("activities")
    .select("*")
    .order("created_at", { ascending: false });
  if (kind) q = q.eq("kind", kind);
  const { data, error } = await q;
  if (error) throw error;
  return (data as unknown as Activity[]) ?? [];
}

export interface CertificateView {
  id: string;
  activity_id: string;
  token_id: number;
  kind: ActivityKind;
  title: string;
  body: string | null;
  image_url: string | null;
  link_url: string | null;
  claimed_at: string;
  chain_status: string;
}

/** Every certificate a fellow has claimed — their proof-of-participation. */
export async function listFellowCertificates(fellowId: string): Promise<CertificateView[]> {
  const { data } = await supabaseAdmin()
    .from("activity_claims")
    .select("id, claimed_at, chain_status, activities(id, token_id, kind, title, body, image_url, link_url)")
    .eq("fellow_id", fellowId)
    .order("claimed_at", { ascending: false });

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return ((data as any[]) ?? [])
    .filter((r) => r.activities)
    .map((r) => ({
      id: r.id,
      activity_id: r.activities.id,
      token_id: r.activities.token_id,
      kind: r.activities.kind,
      title: r.activities.title,
      body: r.activities.body,
      image_url: r.activities.image_url,
      link_url: r.activities.link_url,
      claimed_at: r.claimed_at,
      chain_status: r.chain_status,
    }));
}

export async function hasClaimed(activityId: string, fellowId: string): Promise<boolean> {
  const { data } = await supabaseAdmin()
    .from("activity_claims")
    .select("id")
    .eq("activity_id", activityId)
    .eq("fellow_id", fellowId)
    .maybeSingle();
  return !!data;
}

export async function claimCountFor(activityId: string): Promise<number> {
  const { count } = await supabaseAdmin()
    .from("activity_claims")
    .select("id", { count: "exact", head: true })
    .eq("activity_id", activityId);
  return count ?? 0;
}

/* ---------------- writes ---------------- */

export interface NewActivity {
  kind: ActivityKind;
  title: string;
  body?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  house_id?: string | null;
  created_by_fellow_id?: string | null;
  created_by?: string | null;
  closes_at?: string | null;
  max_claims?: number | null;
}

export async function createActivity(
  input: NewActivity,
): Promise<{ activity: Activity; code: string }> {
  const { code, hash } = generateClaimCode();
  const { data, error } = await supabaseAdmin()
    .from("activities")
    .insert({
      kind: input.kind,
      title: input.title,
      body: input.body ?? null,
      image_url: input.image_url ?? null,
      link_url: input.link_url ?? null,
      house_id: input.house_id ?? null,
      created_by_fellow_id: input.created_by_fellow_id ?? null,
      created_by: input.created_by ?? null,
      claim_code_hash: hash,
      closes_at: input.closes_at ?? null,
      max_claims: input.max_claims ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return { activity: data as unknown as Activity, code };
}
