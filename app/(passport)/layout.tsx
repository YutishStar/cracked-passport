import { auth } from "@clerk/nextjs/server";
import { getCurrentFellow } from "@/lib/auth";
import { FellowGate } from "@/components/fellow-gate";

/**
 * Gate for every Passport route. Signed-out visitors get the branded gate.
 * Signed-in users who never claimed (no fellow row) get it too — the only way
 * to become a fellow is a claim link.
 */
export default async function PassportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) return <FellowGate />;

  const fellow = await getCurrentFellow();
  if (!fellow) return <FellowGate />;

  return <>{children}</>;
}
