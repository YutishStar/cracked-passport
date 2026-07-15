import type { CertificateView } from "@/lib/supabase/queries/activities";
import type { ActivityKind } from "@/lib/supabase/types";

const KIND: Record<ActivityKind, { label: string; icon: string }> = {
  hackathon: { label: "Hackathon", icon: "⚡" },
  luma: { label: "Event", icon: "◆" },
  house: { label: "House", icon: "⌂" },
  activity: { label: "Activity", icon: "✳" },
  build_post: { label: "Build", icon: "▲" },
};

/**
 * Proof-of-participation: everything a fellow showed up for. Each one is an
 * on-chain certificate (ERC-1155) that many people hold — the hackathon they
 * joined, the Luma event they attended, the build they were part of.
 */
export function CertificateList({ items }: { items: CertificateView[] }) {
  if (items.length === 0) {
    return (
      <p className="text-ink-4">
        No certificates yet. They arrive when you join a hackathon, an event, or a build.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((c) => {
        const k = KIND[c.kind];
        return (
          <div
            key={c.id}
            className="group relative overflow-hidden rounded-2xl border border-black/[0.07] bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="eyebrow mb-1.5">
                  <span className="mr-1.5">{k.icon}</span>
                  {k.label}
                </div>
                <div className="font-medium leading-snug text-ink">{c.title}</div>
                {c.body && (
                  <div className="mt-1 line-clamp-2 text-sm text-ink-3">{c.body}</div>
                )}
              </div>
              {c.chain_status === "issued" && (
                <span
                  title="Secured on-chain"
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-moss-soft"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--color-moss)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                </span>
              )}
            </div>

            {c.link_url && (
              <a
                href={c.link_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm text-moss underline underline-offset-4"
              >
                View ↗
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
