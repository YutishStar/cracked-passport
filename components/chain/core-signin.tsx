"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WagmiProvider, useAccount, useSignMessage, useDisconnect } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectButton, RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { wagmiConfig } from "@/lib/chain/wagmi";

const queryClient = new QueryClient();

/**
 * "Sign in with Core" — connect wallet, sign one free message (no gas, no
 * transaction), and if that wallet is linked to a verified Fellow, you're in.
 * This is how a returning Fellow opens their Passport without touching email.
 */
export function CoreSignIn() {
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
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [state, setState] = useState<"idle" | "signing" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    if (!address) return;
    setState("signing");
    setError(null);
    try {
      const nonceRes = await fetch("/api/auth/wallet/nonce").then((r) => r.json());
      const signature = await signMessageAsync({ message: nonceRes.message });

      const verifyRes = await fetch("/api/auth/wallet/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          signature,
          nonce: extractNonce(nonceRes.message),
          token: nonceRes.token,
        }),
      }).then((r) => r.json());

      if (!verifyRes.ok) {
        setError(verifyRes.error ?? "Couldn't sign you in.");
        setState("error");
        disconnect();
        return;
      }

      router.push("/passport");
      router.refresh();
    } catch {
      setError("Sign-in was cancelled or failed.");
      setState("error");
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <ConnectButton label="Connect Core" showBalance={false} chainStatus="none" />
      {isConnected && address && (
        <button
          onClick={signIn}
          disabled={state === "signing"}
          className="w-full rounded-full bg-ink py-3 text-sm text-paper transition-transform hover:-translate-y-px disabled:opacity-50"
        >
          {state === "signing" ? "Check your wallet…" : "Sign in"}
        </button>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function extractNonce(message: string): string {
  return message.split("Nonce: ")[1]?.trim() ?? "";
}
