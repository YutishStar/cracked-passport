import { inspectClaimToken } from "@/lib/supabase/queries/claim";
import { ClaimFlow } from "@/components/claim/claim-flow";

export const dynamic = "force-dynamic";

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const info = await inspectClaimToken(token);

  if (!info.valid) {
    const message =
      info.reason === "used"
        ? "This claim link has already been used."
        : info.reason === "expired"
          ? "This claim link has expired. Ask an admin to resend it."
          : "This claim link is invalid.";
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
        <p className="eyebrow mb-6">Cracked</p>
        <h1 className="font-display text-3xl text-ink">Hmm.</h1>
        <p className="mt-3 max-w-sm text-ink-3">{message}</p>
      </main>
    );
  }

  return (
    <ClaimFlow
      token={token}
      fellowNumber={info.fellowNumber!}
      defaultUsername={info.defaultUsername ?? ""}
    />
  );
}
