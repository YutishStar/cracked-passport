import { listActivities } from "@/lib/supabase/queries/activities";
import { supabaseAdmin } from "@/lib/supabase/server";
import { CreateActivity } from "@/components/passport/create-activity";

export const dynamic = "force-dynamic";

export default async function ActivitiesPage() {
  const activities = await listActivities();

  // claim counts in one round-trip
  const { data: claims } = await supabaseAdmin()
    .from("activity_claims")
    .select("activity_id");
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const counts = ((claims as any[]) ?? []).reduce<Record<string, number>>((acc, c) => {
    acc[c.activity_id] = (acc[c.activity_id] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <h1 className="font-display text-4xl text-ink">Activities</h1>
      <p className="mt-2 text-ink-3">
        Hackathons, events, house activities — each one is a certificate fellows can claim.
      </p>

      <div className="mt-8 max-w-lg">
        <CreateActivity mode="admin" />
      </div>

      <div className="mt-10 space-y-3">
        {activities.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-4 rounded-2xl border border-black/[0.06] bg-white p-5"
          >
            <div className="min-w-0">
              <div className="eyebrow mb-1">
                {a.kind.replace("_", " ")} · #{a.token_id}
              </div>
              <div className="font-medium text-ink">{a.title}</div>
              {a.body && <div className="mt-0.5 truncate text-sm text-ink-3">{a.body}</div>}
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <div className="text-right">
                <div className="font-pixel text-2xl text-ink">{counts[a.id] ?? 0}</div>
                <div className="eyebrow">claimed</div>
              </div>
              <span
                className={
                  a.chain_status === "issued"
                    ? "rounded-full bg-moss-soft px-2.5 py-1 text-xs text-moss"
                    : "rounded-full bg-black/[0.05] px-2.5 py-1 text-xs text-ink-3"
                }
              >
                {a.chain_status === "issued" ? "on-chain" : a.chain_status}
              </span>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <p className="text-ink-3">No activities yet. Create the first one above.</p>
        )}
      </div>
    </div>
  );
}
