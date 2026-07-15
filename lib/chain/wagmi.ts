"use client";

import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  coreWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { avalanche, avalancheFuji } from "wagmi/chains";
import { publicEnv } from "@/lib/env";

const chains = (publicEnv.chainId === 43114 ? [avalanche] : [avalancheFuji]) as [
  typeof avalanche,
];

// Core (core.app) is Avalanche's native wallet — featured first, since it's
// the one the community actually uses. MetaMask/Rainbow/WalletConnect stay as
// fallbacks for anyone without it installed.
const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [coreWallet, metaMaskWallet, rainbowWallet, walletConnectWallet],
    },
  ],
  {
    appName: "Cracked Passport",
    projectId: publicEnv.walletConnectProjectId || "cracked-passport-dev",
  },
);

/** Client-side wagmi/RainbowKit config. Chain follows NEXT_PUBLIC_CHAIN_ID. */
export const wagmiConfig = createConfig({
  connectors,
  chains,
  transports: { [chains[0].id]: http() },
  ssr: true,
});
