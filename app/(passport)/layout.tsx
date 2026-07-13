import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { FellowGate } from "@/components/fellow-gate";

/**
 * Passport routes require a signed-in user. Whether they're a verified fellow,
 * a pending applicant, or brand new is decided per-page (see passport/page.tsx)
 * so non-fellows get the request-verification form instead of a dead end.
 */
export default async function PassportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) return <FellowGate />;

  return (
    <>
      {/* Account menu — see who you're signed in as, and sign out. */}
      <div className="fixed right-5 top-5 z-50">
        <UserButton />
      </div>
      {children}
    </>
  );
}
