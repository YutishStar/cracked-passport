import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type {
  Fellow,
  House,
  Passport,
  StampType,
  AchievementType,
  Perk,
  Sponsor,
  TimelineEvent,
} from "@/lib/supabase/types";

export interface StampView {
  id: string;
  name: string;
  flag: string | null;
  artwork_url: string | null;
  issued_at: string;
  is_new: boolean;
}

export interface AchievementView {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  issued_at: string;
  is_new: boolean;
}

export interface PerkView {
  id: string;
  name: string;
  description: string | null;
  redemption_url: string | null;
  sponsor: string | null;
  redeemed_at: string | null;
}

export interface PassportView {
  fellow: Fellow;
  passport: Passport | null;
  currentHouse: House | null;
  stamps: StampView[];
  achievements: AchievementView[];
  perks: PerkView[];
  timeline: TimelineEvent[];
}

/**
 * Load the full passport for a fellow. `publicOnly` drops perks and
 * non-public timeline events for the public [username] page.
 */
export async function loadPassport(
  fellowId: string,
  opts: { publicOnly?: boolean } = {},
): Promise<PassportView | null> {
  const db = supabaseAdmin();

  const { data: fellow } = await db
    .from("fellows")
    .select("*")
    .eq("id", fellowId)
    .maybeSingle();
  if (!fellow) return null;
  const f = fellow as unknown as Fellow;

  const [passportRes, houseRes, stampRes, achRes, perkRes, tlRes] =
    await Promise.all([
      db.from("passports").select("*").eq("fellow_id", fellowId).maybeSingle(),
      f.current_house_id
        ? db.from("houses").select("*").eq("id", f.current_house_id).maybeSingle()
        : Promise.resolve({ data: null }),
      db
        .from("fellow_stamps")
        .select("id, issued_at, seen_at, stamp_types(name, artwork_url, houses(flag))")
        .eq("fellow_id", fellowId)
        .order("issued_at", { ascending: true }),
      db
        .from("fellow_achievements")
        .select("id, issued_at, seen_at, achievement_types(name, description, icon_url)")
        .eq("fellow_id", fellowId)
        .order("issued_at", { ascending: true }),
      db
        .from("fellow_perks")
        .select("id, redeemed_at, perks(name, description, redemption_url, sponsors(name))")
        .eq("fellow_id", fellowId),
      db
        .from("timeline_events")
        .select("*")
        .eq("fellow_id", fellowId)
        .order("occurred_at", { ascending: true }),
    ]);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const stamps: StampView[] = ((stampRes.data as any[]) ?? []).map((r) => ({
    id: r.id,
    name: r.stamp_types?.name ?? "House",
    flag: r.stamp_types?.houses?.flag ?? null,
    artwork_url: r.stamp_types?.artwork_url ?? null,
    issued_at: r.issued_at,
    is_new: r.seen_at == null,
  }));

  const achievements: AchievementView[] = ((achRes.data as any[]) ?? []).map(
    (r) => ({
      id: r.id,
      name: r.achievement_types?.name ?? "Achievement",
      description: r.achievement_types?.description ?? null,
      icon_url: r.achievement_types?.icon_url ?? null,
      issued_at: r.issued_at,
      is_new: r.seen_at == null,
    }),
  );

  const perks: PerkView[] = opts.publicOnly
    ? []
    : ((perkRes.data as any[]) ?? []).map((r) => ({
        id: r.id,
        name: r.perks?.name ?? "Perk",
        description: r.perks?.description ?? null,
        redemption_url: r.perks?.redemption_url ?? null,
        sponsor: r.perks?.sponsors?.name ?? null,
        redeemed_at: r.redeemed_at,
      }));
  /* eslint-enable @typescript-eslint/no-explicit-any */

  let timeline = (tlRes.data as unknown as TimelineEvent[]) ?? [];
  if (opts.publicOnly) timeline = timeline.filter((t) => t.is_public);

  return {
    fellow: f,
    passport: (passportRes.data as unknown as Passport | null) ?? null,
    currentHouse: (houseRes.data as unknown as House | null) ?? null,
    stamps,
    achievements,
    perks,
    timeline,
  };
}

/** Catalog readers for admin forms. */
export async function listHouses(): Promise<House[]> {
  const { data } = await supabaseAdmin().from("houses").select("*").order("name");
  return (data as unknown as House[]) ?? [];
}
export async function listStampTypes(): Promise<StampType[]> {
  const { data } = await supabaseAdmin().from("stamp_types").select("*").order("name");
  return (data as unknown as StampType[]) ?? [];
}
export async function listAchievementTypes(): Promise<AchievementType[]> {
  const { data } = await supabaseAdmin()
    .from("achievement_types")
    .select("*")
    .order("name");
  return (data as unknown as AchievementType[]) ?? [];
}
export async function listPerks(): Promise<(Perk & { sponsor: Sponsor | null })[]> {
  const { data } = await supabaseAdmin()
    .from("perks")
    .select("*, sponsors(*)")
    .order("name");
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return ((data as any[]) ?? []).map((p) => ({ ...p, sponsor: p.sponsors ?? null }));
}
