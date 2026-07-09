import Link from "next/link";
import { PageTransition } from "@/components/page-transition";
import { copy } from "@/lib/copy";

export default function LandingPage() {
  return (
    <PageTransition>
      <main className="mx-auto flex max-w-[1320px] flex-1 flex-col items-center px-[clamp(20px,4vw,56px)] pt-[12vh] text-center">
        <p className="eyebrow mb-8">Invite-only · Builder community</p>

        <h1 className="font-display max-w-3xl text-[clamp(44px,7vw,92px)] leading-[0.98] tracking-tight text-ink">
          A lifelong passport for the world&apos;s most{" "}
          <em className="italic">cracked</em> builders.
        </h1>

        <p className="mt-7 max-w-md text-lg text-ink-3">
          People apply. We review every one by hand. The accepted become Cracked
          Fellows — and carry their Passport wherever they go next.
        </p>

        <div className="mt-10 flex items-center gap-3">
          <Link
            href="/apply"
            className="rounded-full bg-ink px-7 py-3.5 text-sm text-paper transition-transform hover:-translate-y-px"
          >
            {copy.apply.title}
          </Link>
          <Link
            href="/passport"
            className="rounded-full border border-black/10 px-7 py-3.5 text-sm text-ink transition-colors hover:bg-black/[0.03]"
          >
            {copy.nav.passport}
          </Link>
        </div>
      </main>
    </PageTransition>
  );
}
