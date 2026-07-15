import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import {
  publicClient,
  ownerWalletClient,
  certificatesAddress,
} from "@/lib/chain/clients";
import { crackedCertificatesAbi } from "@/lib/chain/abi";
import { pinJson, ipfsUri } from "@/lib/pinata";
import type { Activity } from "@/lib/supabase/types";

/**
 * On-chain side of activities & certificates.
 *
 * Every activity is one ERC-1155 token id; each fellow who took part claims the
 * same id. The issuer wallet does all the signing and pays all the gas, so a
 * fellow claiming a certificate never touches a wallet or a transaction — it
 * just appears on their passport.
 *
 * In `stub` chain mode these are no-ops: the DB still records the claim, so the
 * whole product works with no chain configured.
 */
const chainOn = () => env.chainMode === "fuji" || env.chainMode === "avalanche";

function activityMetadata(a: Activity) {
  const appUrl = env.appUrl.replace(/\/$/, "");
  return {
    name: a.title,
    description: a.body ?? `A Cracked ${a.kind.replace("_", " ")}.`,
    image: a.image_url ?? undefined,
    external_url: `${appUrl}/c/${a.id}`,
    attributes: [
      { trait_type: "Kind", value: a.kind },
      { trait_type: "Date", value: new Date(a.created_at).toISOString().slice(0, 10) },
    ],
  };
}

/** Register the activity on-chain so it can be claimed. Idempotent-ish. */
export async function registerActivityOnChain(activity: Activity): Promise<void> {
  const db = supabaseAdmin();
  if (!chainOn()) {
    await db.from("activities").update({ chain_status: "deferred" }).eq("id", activity.id);
    return;
  }
  try {
    const cid = await pinJson(`cracked-activity-${activity.token_id}`, activityMetadata(activity));
    const wallet = ownerWalletClient();
    const hash = await wallet.writeContract({
      address: certificatesAddress(),
      abi: crackedCertificatesAbi,
      functionName: "createActivity",
      args: [BigInt(activity.token_id), activity.title, ipfsUri(cid)],
    });
    await publicClient().waitForTransactionReceipt({ hash });

    await db
      .from("activities")
      .update({ chain_status: "issued", metadata_cid: cid, tx_hash: hash })
      .eq("id", activity.id);
  } catch (err) {
    console.error("[certificates] registerActivity failed", err);
    await db.from("activities").update({ chain_status: "failed" }).eq("id", activity.id);
  }
}

/**
 * Mint the certificate to a fellow. Called after the server has already checked
 * they're a verified fellow with a valid claim code — the contract is owner-only.
 */
export async function mintCertificate(params: {
  claimId: string;
  tokenId: number;
  toAddress: string | null;
}): Promise<void> {
  const db = supabaseAdmin();

  // No wallet on file yet → the claim stands, it just isn't on-chain yet.
  if (!chainOn() || !params.toAddress) {
    await db
      .from("activity_claims")
      .update({ chain_status: "deferred" })
      .eq("id", params.claimId);
    return;
  }

  try {
    const wallet = ownerWalletClient();
    const hash = await wallet.writeContract({
      address: certificatesAddress(),
      abi: crackedCertificatesAbi,
      functionName: "claimFor",
      args: [BigInt(params.tokenId), params.toAddress as `0x${string}`],
    });
    await publicClient().waitForTransactionReceipt({ hash });

    await db
      .from("activity_claims")
      .update({ chain_status: "issued", tx_hash: hash })
      .eq("id", params.claimId);
  } catch (err) {
    console.error("[certificates] mintCertificate failed", err);
    await db.from("activity_claims").update({ chain_status: "failed" }).eq("id", params.claimId);
  }
}
