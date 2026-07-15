import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { FellowGate } from "@/components/fellow-gate";
import { getWalletSession } from "@/lib/wallet-session";
import { WalletAccountMenu } from "@/components/chain/wallet-account-menu";

/**
 * Passport routes require a signed-in user — either a Clerk session (email,
 * how applying works) or a wallet session (Sign in with Core, how a returning
 * Fellow opens their Passport). Whether they're a verified fellow, a pending
 * applicant, or brand new is decided per-page so non-fellows get the
 * request-verification form instead of a dead end.
 */
export default async function PassportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  const wallet = userId ? null : await getWalletSession();
  if (!userId && !wallet) return <FellowGate />;

  return (
    <>
      {/* Account menu — see who you're signed in as, and sign out. */}
      <div className="fixed right-5 top-5 z-50">
        {userId ? <UserButton /> : <WalletAccountMenu address={wallet!.address} />}
      </div>
      {children}
    </>
  );
}
