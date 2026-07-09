/**
 * Server-side environment access. Import only from server code.
 *
 * We intentionally do NOT throw at module load for optional integrations
 * (Resend, Pinata, chain) so the app boots in stub/dev mode with just Clerk +
 * Supabase configured. Each integration validates its own keys when used.
 */

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined;
}

export const env = {
  // Supabase (required — the data layer)
  get supabaseUrl() {
    return required("SUPABASE_URL");
  },
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },

  // Email
  get resendApiKey() {
    return optional("RESEND_API_KEY");
  },
  emailFrom: process.env.EMAIL_FROM ?? "Cracked <passport@crackedhq.com>",

  // Pinata / IPFS
  get pinataJwt() {
    return optional("PINATA_JWT");
  },
  pinataGateway: process.env.PINATA_GATEWAY ?? "https://gateway.pinata.cloud",

  // Chain
  chainMode: (process.env.CHAIN_MODE ?? "stub") as "stub" | "fuji" | "avalanche",
  get deployerPrivateKey() {
    return optional("DEPLOYER_PRIVATE_KEY");
  },
  passportContractAddress: optional("PASSPORT_CONTRACT_ADDRESS"),
  fujiRpcUrl:
    process.env.FUJI_RPC_URL ?? "https://api.avax-test.network/ext/bc/C/rpc",
  avalancheRpcUrl:
    process.env.AVALANCHE_RPC_URL ?? "https://api.avax.network/ext/bc/C/rpc",

  // App
  adminEmails: (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
  appUrl:
    process.env.NEXT_PUBLIC_APP_URL ?? "https://passport.crackedhq.com",
};

/** Public (client-safe) env — only NEXT_PUBLIC_* values. */
export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://passport.crackedhq.com",
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 43113),
  walletConnectProjectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",
};
