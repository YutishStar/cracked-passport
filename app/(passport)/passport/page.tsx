import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getCurrentFellow } from "@/lib/auth";
import { getApplicationByClerkUser } from "@/lib/supabase/queries/applications";
import { loadPassport } from "@/lib/supabase/queries/passport";
import { mrzLines } from "@/lib/mrz";
import { copy } from "@/lib/copy";
import { PassportCard } from "@/components/passport/passport-card";
import { StampGrid } from "@/components/passport/stamp-grid";
import { EditProfileSheet } from "@/components/passport/edit-profile-sheet";
import { RequestVerification } from "@/components/passport/request-verification";
import { UnderReview } from "@/components/passport/under-review";
import { CertificateList } from "@/components/passport/certificate-list";
import { CreateActivity } from "@/components/passport/create-activity";
import { listFellowCertificates } from "@/lib/supabase/queries/activities";
import {
  PassportSection,
  AboutSection,
  JourneyTimeline,
  AchievementList,
  PerkList,
} from "@/components/passport/sections";
import { BrandMark } from "@/components/brand-mark";

export const dynamic = "force-dynamic";

export default async function PassportHome() {
  const { userId } = await auth();
  const fellow = await getCurrentFellow();

  // Not a fellow yet → route by application state (self-serve verification).
  if (!fellow) {
    const app = userId ? await getApplicationByClerkUser(userId) : null;
    if (app?.status === "pending") return <UnderReview status="pending" />;
    if (app?.status === "rejected") return <UnderReview status="rejected" />;
    return <RequestVerification />;
  }

  // Fellow exists but hasn't finished onboarding → pick handle + verify.
  if (fellow.status !== "claimed" || !fellow.username) {
    redirect("/welcome");
  }

  const [view, certificates] = await Promise.all([
    loadPassport(fellow.id),
    listFellowCertificates(fellow.id),
  ]);
  if (!view) redirect("/");

  const mrz = mrzLines({
    fellowNumber: fellow.fellow_number,
    displayName: fellow.display_name,
    username: fellow.username,
    joinYear: new Date(fellow.created_at).getUTCFullYear(),
  });

  return (
    <div className="min-h-[100dvh]">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <BrandMark />
        {fellow.username && (
          <Link
            href={`/${fellow.username}`}
            className="text-sm text-ink-3 underline underline-offset-4 hover:text-ink"
          >
            View public →
          </Link>
        )}
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
          {view.passport && view.passport.status !== "issued" && (
            <Link
              href="/verify"
              className="mt-4 flex items-center justify-center rounded-full border border-black/10 py-2.5 text-sm text-ink-2 transition-colors hover:bg-black/[0.03]"
            >
              Secure your Passport on-chain →
            </Link>
          )}
        </div>

        <PassportSection title={copy.passport.sections.about}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <AboutSection fellow={fellow} />
            </div>
            <EditProfileSheet fellow={fellow} />
          </div>
        </PassportSection>

        <PassportSection title={copy.passport.sections.journey}>
          <JourneyTimeline events={view.timeline} />
        </PassportSection>

        <PassportSection title={copy.passport.sections.stamps}>
          <StampGrid stamps={view.stamps} canMarkSeen />
        </PassportSection>

        <PassportSection title={copy.passport.sections.certificates}>
          <CertificateList items={certificates} />
        </PassportSection>

        {/* Daily build post — publish what you're shipping; anyone who was part
            of it can claim the certificate from the link. */}
        <PassportSection title="Today's Build">
          <div className="max-w-lg">
            <CreateActivity mode="build_post" />
          </div>
        </PassportSection>

        <PassportSection title={copy.passport.sections.achievements}>
          <AchievementList items={view.achievements} />
        </PassportSection>

        <PassportSection title={copy.passport.sections.perks}>
          <PerkList items={view.perks} />
        </PassportSection>
      </main>
    </div>
  );
}
