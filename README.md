# Cracked Passport

The lifelong passport of every Cracked Fellow. Next.js App Router + Supabase +
Clerk + Resend + Avalanche (via a swappable chain layer). The blockchain is
invisible — the UI only ever says "Passport", "Claim", "Verified".

## Run it locally

```bash
cp .env.example .env.local   # fill in the values below
npm install
npm run dev                  # http://localhost:3000
```

The app runs fully with `CHAIN_MODE=stub` — no wallet, contract, or Pinata
needed. Passports are marked "issued" without touching a chain.

## What you must configure

| Service | Needed for | Setup |
|---|---|---|
| **Clerk** | Sign-in (Google) | Create an app, enable Google, copy the two keys. Set `/sign-in` as the sign-in URL. |
| **Supabase** | All data | Run `supabase/migrations/*.sql` then `supabase/seed.sql` in the SQL editor. Copy the project URL + **service-role** key (no anon key needed). |
| **Resend** | Acceptance email | Verify `crackedhq.com` (SPF+DKIM), set `RESEND_API_KEY`. Optional — without it, approval prints a copyable claim link instead. |
| **Pinata** | On-chain metadata | Only for `CHAIN_MODE=fuji/avalanche`. Scoped JWT with pinJSON. |
| **Deployer wallet** | Minting | Only for chain modes. Fresh key, funded at the Fuji faucet. Deploy with Foundry (below). |

Set `ADMIN_EMAILS` to your email — that's the only account that can see `/admin`.

## Golden path (stub mode)

1. `/apply` → submit an application.
2. `/admin/applications` → Approve → becomes Fellow #001, claim link generated
   (emailed if Resend is set, else copyable from the toast).
3. Open the claim link → sign in with Google → pick a handle → verify → the
   creation animation → `/passport`.
4. `/admin/fellows/<id>` → issue a house stamp / achievement / perk.
5. Visit `/<handle>` for the public passport.

## Smart contract (Phase F — optional)

```bash
cd contracts
forge test                                   # 6 tests, incl. soulbound revert
forge script script/Deploy.s.sol --rpc-url fuji --broadcast --verify
# put the deployed address in PASSPORT_CONTRACT_ADDRESS, set CHAIN_MODE=fuji
```

`CrackedPassport.sol` is a soulbound ERC-721: tokenId == fellow number,
owner-only mint/update, transfers revert (with an `adminTransfer` escape hatch
for lost wallets). The chain holds ownership + a metadata pointer only; stamps
and achievements live in Postgres and refresh the token URI.

## Architecture notes

- **Auth boundary:** Supabase is reached only with the service-role key from
  server code. RLS is on with no policies (deny-by-default). All authorization
  is in `lib/auth.ts` (`requireFellow`, `requireAdmin`).
- **No-crypto-language:** every user-facing string is in `lib/copy.ts`. A grep
  for `nft|mint|wallet address|blockchain` over `app/` + `components/` (outside
  `lib/chain`) must stay empty.
- **Chain is swappable:** `lib/passport/issuer.ts` picks stub / fuji / avalanche
  by `CHAIN_MODE`. Mainnet is an env flip.
