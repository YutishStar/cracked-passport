import "server-only";
import { createPublicClient, createWalletClient, http, type Address } from "viem";
import { avalanche, avalancheFuji } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { env } from "@/lib/env";

export function activeChain() {
  return env.chainMode === "avalanche" ? avalanche : avalancheFuji;
}

function rpcUrl() {
  return env.chainMode === "avalanche" ? env.avalancheRpcUrl : env.fujiRpcUrl;
}

export function publicClient() {
  return createPublicClient({ chain: activeChain(), transport: http(rpcUrl()) });
}

/** Owner wallet client (the issuer). Fellows never sign — only this key does. */
export function ownerWalletClient() {
  const key = env.deployerPrivateKey;
  if (!key) throw new Error("DEPLOYER_PRIVATE_KEY not set");
  const account = privateKeyToAccount(
    (key.startsWith("0x") ? key : `0x${key}`) as `0x${string}`,
  );
  return createWalletClient({ account, chain: activeChain(), transport: http(rpcUrl()) });
}

export function contractAddress(): Address {
  const addr = env.passportContractAddress;
  if (!addr) throw new Error("PASSPORT_CONTRACT_ADDRESS not set");
  return addr as Address;
}

export function certificatesAddress(): Address {
  const addr = env.certificatesContractAddress;
  if (!addr) throw new Error("CERTIFICATES_CONTRACT_ADDRESS not set");
  return addr as Address;
}
