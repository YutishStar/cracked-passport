import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { OnchainIssuer } from "@/lib/passport/onchain-issuer";
import type { PassportStatus } from "@/lib/supabase/types";

export interface IssueInput {
  fellowId: string;
  fellowNumber: number;
  toAddress: string | null;
}

export interface IssueResult {
  status: PassportStatus;
  txHash?: string;
  tokenId?: number;
}

export interface PassportIssuer {
  issuePassport(input: IssueInput): Promise<IssueResult>;
  refreshMetadata(fellowId: string): Promise<void>;
  getStatus(fellowNumber: number): Promise<"issued" | "pending" | "none">;
}

/**
 * Stub issuer — the whole product works with zero chain configuration. It marks
 * the passport 'deferred' (claimed-but-not-yet-on-chain) so the UI reads as
 * done. Swapped for the Fuji/Avalanche issuer by CHAIN_MODE in createIssuer().
 */
class StubIssuer implements PassportIssuer {
  async issuePassport({ fellowId, fellowNumber }: IssueInput): Promise<IssueResult> {
    await supabaseAdmin()
      .from("passports")
      .update({ status: "deferred", token_id: fellowNumber, issued_at: new Date().toISOString() })
      .eq("fellow_id", fellowId);
    return { status: "deferred", tokenId: fellowNumber };
  }

  async refreshMetadata(): Promise<void> {
    /* no-op in stub mode */
  }

  async getStatus(): Promise<"issued" | "pending" | "none"> {
    return "issued"; // deferred reads as ready to the UI
  }
}

let cached: PassportIssuer | null = null;

export function createIssuer(): PassportIssuer {
  if (cached) return cached;
  if (env.chainMode === "fuji" || env.chainMode === "avalanche") {
    cached = new OnchainIssuer();
  } else {
    cached = new StubIssuer();
  }
  return cached;
}
