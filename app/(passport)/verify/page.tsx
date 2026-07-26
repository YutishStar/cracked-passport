import { VerifyStep } from "@/components/claim/verify-step";
import { VerifyStepOnchain } from "@/components/chain/verify-step-onchain";
import { env } from "@/lib/env";

// The verifyOwnership server action waits on a real Fuji tx receipt (~10-15s,
// more under congestion) — the platform default is too short for that.
export const maxDuration = 60;

export default function VerifyPage() {
  if (env.chainMode !== "stub") return <VerifyStepOnchain />;
  return <VerifyStep chainEnabled={false} />;
}
