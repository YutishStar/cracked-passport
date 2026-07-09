import { VerifyStep } from "@/components/claim/verify-step";
import { VerifyStepOnchain } from "@/components/chain/verify-step-onchain";
import { env } from "@/lib/env";

export default function VerifyPage() {
  if (env.chainMode !== "stub") return <VerifyStepOnchain />;
  return <VerifyStep chainEnabled={false} />;
}
