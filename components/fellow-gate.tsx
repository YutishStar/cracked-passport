import { SignInButton } from "@clerk/nextjs";
import { copy } from "@/lib/copy";

/** Shown to signed-out visitors who reach a gated Passport route. */
export function FellowGate() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow mb-6">Cracked</p>
      <h1 className="font-display max-w-xl text-3xl leading-tight text-ink sm:text-4xl">
        {copy.gate.title}
      </h1>
      <p className="mt-4 max-w-sm text-ink-3">{copy.gate.body}</p>
      <SignInButton mode="modal">
        <button className="mt-8 rounded-full bg-ink px-7 py-3 text-sm text-paper transition-transform hover:-translate-y-px">
          {copy.gate.signIn}
        </button>
      </SignInButton>
    </main>
  );
}
