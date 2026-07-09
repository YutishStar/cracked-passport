"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { avalanche, avalancheFuji } from "wagmi/chains";
import { publicEnv } from "@/lib/env";

/** Client-side wagmi/RainbowKit config. Chain follows NEXT_PUBLIC_CHAIN_ID. */
export const wagmiConfig = getDefaultConfig({
  appName: "Cracked Passport",
  projectId: publicEnv.walletConnectProjectId || "cracked-passport-dev",
  chains: publicEnv.chainId === 43114 ? [avalanche] : [avalancheFuji],
  ssr: true,
});
