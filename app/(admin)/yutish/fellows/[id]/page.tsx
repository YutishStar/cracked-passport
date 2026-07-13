import Link from "next/link";
import { notFound } from "next/navigation";
import { getFellowById } from "@/lib/supabase/queries/fellows";
import {
  listHouses,
  listStampTypes,
  listAchievementTypes,
  listPerks,
} from "@/lib/supabase/queries/passport";
import { FellowIssueForms } from "@/components/admin/fellow-issue-forms";
import { fmt } from "@/lib/copy";

export const dynamic = "force-dynamic";

export default async function FellowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [fellow, houses, stampTypes, achievementTypes, perks] = await Promise.all([
    getFellowById(id),
    listHouses(),
    listStampTypes(),
    listAchievementTypes(),
    listPerks(),
  ]);
  if (!fellow) notFound();

  return (
    <div>
      <Link href="/yutish/fellows" className="eyebrow hover:text-ink">
        ← Fellows
      </Link>
      <div className="mt-4 flex items-baseline gap-4">
        <span className="font-pixel text-5xl text-ink">#{fmt(fellow.fellow_number)}</span>
        <div>
          <h1 className="font-display text-3xl text-ink">{fellow.display_name}</h1>
          <p className="text-ink-3">
            {fellow.username ? `@${fellow.username} · ` : ""}
            {fellow.status}
          </p>
        </div>
        {fellow.username && (
          <Link
            href={`/${fellow.username}`}
            className="ml-auto rounded-full border border-black/10 px-4 py-2 text-sm text-ink-2 hover:bg-black/[0.03]"
          >
            View public passport →
          </Link>
        )}
      </div>

      <div className="mt-10">
        <FellowIssueForms
          fellowId={fellow.id}
          houses={houses}
          stampTypes={stampTypes}
          achievementTypes={achievementTypes}
          perks={perks}
        />
      </div>
    </div>
  );
}
