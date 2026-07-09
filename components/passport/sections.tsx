import { copy } from "@/lib/copy";
import type {
  AchievementView,
  PerkView,
} from "@/lib/supabase/queries/passport";
import type { Fellow, TimelineEvent } from "@/lib/supabase/types";

export function PassportSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-black/[0.07] py-8">
      <h2 className="eyebrow mb-5">{title}</h2>
      {children}
    </section>
  );
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ---------------- About ---------------- */
export function AboutSection({ fellow }: { fellow: Fellow }) {
  const links = fellow.links ?? {};
  const entries = [
    ["GitHub", links.github],
    ["LinkedIn", links.linkedin],
    ["X", links.x],
    ["Portfolio", links.portfolio],
  ].filter(([, v]) => !!v) as [string, string][];

  return (
    <div className="space-y-5">
      {fellow.bio ? (
        <p className="text-lg leading-relaxed text-ink-2">{fellow.bio}</p>
      ) : (
        <p className="text-ink-4">No bio yet.</p>
      )}
      {fellow.current_startup && (
        <p className="text-sm text-ink-3">
          <span className="eyebrow mr-2">Building</span>
          {fellow.current_startup}
        </p>
      )}
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {entries.map(([label, href]) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-black/10 px-3.5 py-1.5 text-sm text-ink-2 transition-colors hover:border-black/30 hover:text-ink"
            >
              {label} ↗
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Journey ---------------- */
export function JourneyTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-ink-4">{copy.passport.emptyJourney}</p>;
  }
  return (
    <ol className="relative ml-1 space-y-6 border-l border-black/[0.09] pl-6">
      {events.map((e, i) => {
        const latest = i === events.length - 1;
        return (
          <li key={e.id} className="relative">
            <span
              className={`absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-paper ${
                latest ? "bg-moss" : "bg-ink-4"
              }`}
            />
            <div className="font-mono text-[11px] uppercase tracking-wider text-ink-4">
              {fmtDate(e.occurred_at)}
            </div>
            <div className="mt-0.5 text-ink">{e.title}</div>
            {e.subtitle && <div className="text-sm text-ink-3">{e.subtitle}</div>}
          </li>
        );
      })}
    </ol>
  );
}

/* ---------------- Achievements ---------------- */
export function AchievementList({ items }: { items: AchievementView[] }) {
  if (items.length === 0) {
    return <p className="text-ink-4">{copy.passport.emptyAchievements}</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((a) => (
        <div
          key={a.id}
          className="rounded-2xl border border-black/[0.07] bg-white p-4"
        >
          <div className="font-medium text-ink">{a.name}</div>
          {a.description && (
            <div className="mt-1 text-sm text-ink-3">{a.description}</div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Perks ---------------- */
export function PerkList({ items }: { items: PerkView[] }) {
  if (items.length === 0) {
    return <p className="text-ink-4">{copy.passport.emptyPerks}</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((p) => (
        <div key={p.id} className="rounded-2xl border border-black/[0.07] bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="font-medium text-ink">{p.name}</div>
            {p.sponsor && <div className="eyebrow">{p.sponsor}</div>}
          </div>
          {p.description && (
            <div className="mt-1 text-sm text-ink-3">{p.description}</div>
          )}
          {p.redemption_url && (
            <a
              href={p.redemption_url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm text-moss underline underline-offset-4"
            >
              Redeem →
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
