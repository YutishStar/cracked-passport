import { notFound } from "next/navigation";
import { getCurrentFellow } from "@/lib/auth";
import {
  getActivity,
  claimCountFor,
  hasClaimed,
} from "@/lib/supabase/queries/activities";
import { ClaimCertificate } from "@/components/passport/claim-certificate";
import { RequestVerification } from "@/components/passport/request-verification";

export const dynamic = "force-dynamic";

/**
 * The claim link: /c/<activityId>?k=<code>
 * Only verified fellows can claim — anyone else lands on the request form,
 * which is the right funnel: "you need to be a Fellow to collect this."
 */
export default async function ClaimPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ k?: string }>;
}) {
  const { id } = await params;
  const { k } = await searchParams;

  const activity = await getActivity(id);
  if (!activity) notFound();

  const fellow = await getCurrentFellow();
  if (!fellow || fellow.status !== "claimed") {
    return <RequestVerification />;
  }

  const [count, already] = await Promise.all([
    claimCountFor(id),
    hasClaimed(id, fellow.id),
  ]);

  return (
    <ClaimCertificate
      activityId={activity.id}
      code={k ?? ""}
      kind={activity.kind}
      title={activity.title}
      body={activity.body}
      linkUrl={activity.link_url}
      claimCount={count}
      alreadyClaimed={already}
    />
  );
}
