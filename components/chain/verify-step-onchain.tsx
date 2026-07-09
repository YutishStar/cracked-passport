"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { WagmiProvider, useAccount } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, ConnectButton, lightTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { wagmiConfig } from "@/lib/chain/wagmi";
import { verifyOwnership } from "@/app/(passport)/actions";
import { copy } from "@/lib/copy";

const queryClient = new QueryClient();

/** On-chain verify step: connect a wallet (framed as ownership), then issue. */
export function VerifyStepOnchain() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={lightTheme({ accentColor: "#3d6b4e", borderRadius: "large" })}>
          <Inner />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function Inner() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [busy, setBusy] = useState(false);

  async function proceed(addr: string | null) {
    setBusy(true);
    await verifyOwnership(addr);
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

      <div className="mt-9 flex flex-col items-center gap-4">
        <ConnectButton label={copy.claim.verifyAction} showBalance={false} chainStatus="none" />
        {isConnected && address && (
          <button
            onClick={() => proceed(address)}
            disabled={busy}
            className="rounded-full bg-ink px-7 py-3.5 text-sm text-paper transition-transform hover:-translate-y-px disabled:opacity-50"
          >
            {busy ? "…" : copy.claim.welcomeContinue}
          </button>
        )}
        <button
          onClick={() => proceed(null)}
          disabled={busy}
          className="text-sm text-ink-4 underline underline-offset-4 hover:text-ink-2 disabled:opacity-50"
        >
          {copy.claim.verifyLater}
        </button>
      </div>
    </motion.div>
  );
}
