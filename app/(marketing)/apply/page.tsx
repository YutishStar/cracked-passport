import { PageTransition } from "@/components/page-transition";
import { ApplyForm } from "@/components/marketing/apply-form";
import { copy } from "@/lib/copy";

export default function ApplyPage() {
  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-lg flex-1 px-[clamp(20px,4vw,56px)] pb-24 pt-[12vh]">
        <p className="eyebrow mb-6">Apply</p>
        <h1 className="font-display text-[clamp(34px,5vw,56px)] leading-tight text-ink">
          {copy.apply.title}
        </h1>
        <p className="mt-4 mb-10 text-ink-3">{copy.apply.lede}</p>
        <ApplyForm />
      </main>
    </PageTransition>
  );
}
