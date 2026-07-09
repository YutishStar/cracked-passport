import { PageTransition } from "@/components/page-transition";

export default function AboutPage() {
  return (
    <PageTransition>
      <main className="mx-auto max-w-2xl flex-1 px-[clamp(20px,4vw,56px)] pt-[12vh]">
        <p className="eyebrow mb-6">About Cracked</p>
        <h1 className="font-display text-[clamp(36px,5vw,64px)] leading-tight text-ink">
          A spiderweb of cracked people.
        </h1>
        <div className="mt-8 space-y-5 text-lg leading-relaxed text-ink-2">
          <p>
            Cracked is an invite-only hacker house and builder community. People
            apply, we review every application by hand, and only accepted
            builders become Cracked Fellows.
          </p>
          <p>
            Every accepted Fellow receives a lifelong Cracked Passport — a record
            of their journey inside the community. The houses they&apos;ve lived
            in, the things they&apos;ve built, and the people they found along the
            way.
          </p>
        </div>
      </main>
    </PageTransition>
  );
}
