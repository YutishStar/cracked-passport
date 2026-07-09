import { NextResponse } from "next/server";
import { getFellowByUsername } from "@/lib/supabase/queries/fellows";
import { loadPassport } from "@/lib/supabase/queries/passport";
import { fmt } from "@/lib/copy";

/** Public passport JSON. Public fields only — no email, wallet, or perks. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const fellow = await getFellowByUsername(username);
  if (!fellow || fellow.status !== "claimed") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const view = await loadPassport(fellow.id, { publicOnly: true });
  if (!view) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(
    {
      fellow_number: fellow.fellow_number,
      display_name: fellow.display_name,
      username: fellow.username,
      handle: `#${fmt(fellow.fellow_number)}`,
      bio: fellow.bio,
      current_startup: fellow.current_startup,
      links: fellow.links,
      current_house: view.currentHouse
        ? { name: view.currentHouse.name, flag: view.currentHouse.flag }
        : null,
      stamps: view.stamps.map((s) => ({ name: s.name, flag: s.flag })),
      achievements: view.achievements.map((a) => ({ name: a.name })),
      journey: view.timeline.map((t) => ({
        kind: t.kind,
        title: t.title,
        occurred_at: t.occurred_at,
      })),
    },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } },
  );
}
