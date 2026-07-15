import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getFellowByUsername } from "@/lib/supabase/queries/fellows";
import { loadPassport } from "@/lib/supabase/queries/passport";
import { mrzLines } from "@/lib/mrz";
import { copy, fmt } from "@/lib/copy";
import { PassportCard } from "@/components/passport/passport-card";
import { StampGrid } from "@/components/passport/stamp-grid";
import { PassportOpenTracker } from "@/components/passport/passport-open-tracker";
import { CertificateList } from "@/components/passport/certificate-list";
import { listFellowCertificates } from "@/lib/supabase/queries/activities";
import {
  PassportSection,
  AboutSection,
  JourneyTimeline,
  AchievementList,
} from "@/components/passport/sections";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const fellow = await getFellowByUsername(username);
  if (!fellow || fellow.status === "revoked") return { title: "Passport not found" };
  const title = `${fellow.display_name} · Cracked Fellow #${fmt(fellow.fellow_number)}`;
  return {
    title,
    description: fellow.bio ?? `The Cracked Passport of ${fellow.display_name}.`,
    openGraph: { title, description: fellow.bio ?? undefined },
  };
}

export default async function PublicPassportPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const fellow = await getFellowByUsername(username);
  if (!fellow || fellow.status !== "claimed") notFound();

  const [view, certificates] = await Promise.all([
    loadPassport(fellow.id, { publicOnly: true }),
    listFellowCertificates(fellow.id),
  ]);
  if (!view) notFound();

  const mrz = mrzLines({
    fellowNumber: fellow.fellow_number,
    displayName: fellow.display_name,
    username: fellow.username,
    joinYear: new Date(fellow.created_at).getUTCFullYear(),
  });

  return (
    <div className="min-h-[100dvh] bg-paper">
      <PassportOpenTracker fellowName={fellow.display_name} />

      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-pixel text-xl text-ink">
          crackedHQ<span className="text-moss">.</span>
        </Link>
        <span className="eyebrow">Public Passport</span>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-24">
        <div className="mx-auto max-w-md py-4">
          <PassportCard
            displayName={fellow.display_name}
            fellowNumber={fellow.fellow_number}
            username={fellow.username}
            currentHouse={
              view.currentHouse
                ? { name: view.currentHouse.name, flag: view.currentHouse.flag }
                : null
            }
            avatarUrl={fellow.avatar_url}
            mrz={mrz}
          />
        </div>

        <PassportSection title={copy.passport.sections.about}>
          <AboutSection fellow={fellow} />
        </PassportSection>

        <PassportSection title={copy.passport.sections.journey}>
          <JourneyTimeline events={view.timeline} />
        </PassportSection>

        <PassportSection title={copy.passport.sections.stamps}>
          <StampGrid stamps={view.stamps} />
        </PassportSection>

        <PassportSection title={copy.passport.sections.certificates}>
          <CertificateList items={certificates} />
        </PassportSection>

        <PassportSection title={copy.passport.sections.achievements}>
          <AchievementList items={view.achievements} />
        </PassportSection>
      </main>
    </div>
  );
}
