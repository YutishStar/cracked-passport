"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { verifyOwnership } from "@/app/(passport)/actions";
import { copy } from "@/lib/copy";

/**
 * Ownership-verification step. In stub mode both actions proceed without a
 * wallet. Phase F swaps the primary button for a RainbowKit connect that passes
 * the verified address into verifyOwnership().
 */
export function VerifyStep({ chainEnabled }: { chainEnabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function proceed(address: string | null) {
    setBusy(true);
    await verifyOwnership(address);
    router.push("/creating");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-6 text-center"
    >
      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-moss-soft">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-moss)" strokeWidth="1.6">
          <path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4z" strokeLinejoin="round" />
          <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="font-display text-3xl text-ink">{copy.claim.verifyTitle}</h1>
      <p className="mt-4 max-w-sm text-ink-3">{copy.claim.verifyBody}</p>

      <button
        onClick={() => proceed(null)}
        disabled={busy}
        className="mt-9 w-full max-w-xs rounded-full bg-ink py-3.5 text-sm text-paper transition-transform hover:-translate-y-px disabled:opacity-50"
      >
        {busy ? "…" : copy.claim.verifyAction}
      </button>

      {chainEnabled && (
        <button
          onClick={() => proceed(null)}
          disabled={busy}
          className="mt-3 text-sm text-ink-4 underline underline-offset-4 hover:text-ink-2 disabled:opacity-50"
        >
          {copy.claim.verifyLater}
        </button>
      )}
    </motion.div>
  );
}
