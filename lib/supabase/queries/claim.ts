import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { hashClaimToken } from "@/lib/claim-tokens";

export interface ClaimTokenInfo {
  valid: boolean;
  reason?: "invalid" | "used" | "expired";
  fellowNumber?: number;
  defaultUsername?: string;
  displayName?: string;
}

/** Read-only preview of a claim token for rendering the claim page. */
export async function inspectClaimToken(rawToken: string): Promise<ClaimTokenInfo> {
  const hash = hashClaimToken(rawToken);
  const { data: tok } = await supabaseAdmin()
    .from("claim_tokens")
    .select("used_at, expires_at, fellow_id")
    .eq("token_hash", hash)
    .maybeSingle();

  if (!tok) return { valid: false, reason: "invalid" };
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const t = tok as any;
  if (t.used_at) return { valid: false, reason: "used" };
  if (new Date(t.expires_at) < new Date()) return { valid: false, reason: "expired" };

  const { data: fellow } = await supabaseAdmin()
    .from("fellows")
    .select("fellow_number, display_name, links")
    .eq("id", t.fellow_id)
    .maybeSingle();
  const f = fellow as any;
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const gh: string | undefined = f?.links?.github;
  const ghHandle = gh
    ? gh.replace(/\/+$/, "").split("/").pop()
    : undefined;

  return {
    valid: true,
    fellowNumber: f?.fellow_number,
    displayName: f?.display_name,
    defaultUsername: ghHandle || f?.display_name,
  };
}
