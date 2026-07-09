import "server-only";
import { fmt } from "@/lib/copy";
import { supabaseAdmin } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import {
  publicClient,
  ownerWalletClient,
  contractAddress,
} from "@/lib/chain/clients";
import { crackedPassportAbi } from "@/lib/chain/abi";
import { pinJson, ipfsUri } from "@/lib/pinata";
import { buildMetadata } from "@/lib/passport/metadata";
import type { PassportIssuer, IssueInput, IssueResult } from "@/lib/passport/issuer";

/**
 * Real issuer for Fuji / Avalanche. The owner wallet mints one token
 * (tokenId == fellowNumber) to the fellow's verified address, pointing at
 * freshly-pinned IPFS metadata. All failures land in passports.status='failed'
 * so the admin can retry — issuance never blocks the claim UX.
 */
export class OnchainIssuer implements PassportIssuer {
  async issuePassport({ fellowId, fellowNumber, toAddress }: IssueInput): Promise<IssueResult> {
    const db = supabaseAdmin();
    // No wallet yet → keep it deferred; a later verify/retry will mint.
    if (!toAddress) {
      await db.from("passports").update({ status: "deferred", token_id: fellowNumber }).eq("fellow_id", fellowId);
      return { status: "deferred", tokenId: fellowNumber };
    }

    await db.from("passports").update({ status: "pending", token_id: fellowNumber }).eq("fellow_id", fellowId);

    try {
      const meta = await buildMetadata(fellowId);
      const cid = await pinJson(`cracked-passport-${fmt(fellowNumber)}`, meta);

      const wallet = ownerWalletClient();
      const hash = await wallet.writeContract({
        address: contractAddress(),
        abi: crackedPassportAbi,
        functionName: "mintPassport",
        args: [toAddress as `0x${string}`, BigInt(fellowNumber), ipfsUri(cid)],
      });
      await publicClient().waitForTransactionReceipt({ hash });

      await db
        .from("passports")
        .update({
          status: "issued",
          token_id: fellowNumber,
          contract_address: contractAddress(),
          chain: env.chainMode === "avalanche" ? "avalanche" : "fuji",
          tx_hash: hash,
          metadata_cid: cid,
          issued_at: new Date().toISOString(),
        })
        .eq("fellow_id", fellowId);

      return { status: "issued", txHash: hash, tokenId: fellowNumber };
    } catch (err) {
      console.error("[issuer] mint failed", err);
      await db.from("passports").update({ status: "failed" }).eq("fellow_id", fellowId);
      return { status: "failed", tokenId: fellowNumber };
    }
  }

  async refreshMetadata(fellowId: string): Promise<void> {
    const db = supabaseAdmin();
    const { data } = await db
      .from("passports")
      .select("token_id, status")
      .eq("fellow_id", fellowId)
      .maybeSingle();
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const row = data as any;
    if (!row || row.status !== "issued" || row.token_id == null) return;

    try {
      const meta = await buildMetadata(fellowId);
      const cid = await pinJson(`cracked-passport-${fmt(row.token_id)}`, meta);
      const wallet = ownerWalletClient();
      const hash = await wallet.writeContract({
        address: contractAddress(),
        abi: crackedPassportAbi,
        functionName: "setTokenURI",
        args: [BigInt(row.token_id), ipfsUri(cid)],
      });
      await publicClient().waitForTransactionReceipt({ hash });
      await db.from("passports").update({ metadata_cid: cid }).eq("fellow_id", fellowId);
    } catch (err) {
      console.error("[issuer] refreshMetadata failed", err);
    }
  }

  async getStatus(fellowNumber: number): Promise<"issued" | "pending" | "none"> {
    try {
      await publicClient().readContract({
        address: contractAddress(),
        abi: crackedPassportAbi,
        functionName: "ownerOf",
        args: [BigInt(fellowNumber)],
      });
      return "issued";
    } catch {
      return "none";
    }
  }
}
