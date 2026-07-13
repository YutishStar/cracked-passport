import { SignInButton } from "@clerk/nextjs";
import { copy } from "@/lib/copy";

/**
 * Shown to signed-out visitors who reach a gated Passport route.
 *
 * A frosted modal floating over a blurred teaser of the passport itself — the
 * thing you're locked out of is visible, just out of focus, behind the glass.
 */
export function FellowGate() {
  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-paper px-6">
      {/* ---- behind the glass: the passport, out of reach ---- */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* atmospheric glows */}
        <div className="absolute left-1/2 top-1/2 h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-moss/25" />
        <div className="absolute left-[22%] top-[24%] h-[38vh] w-[38vh] rounded-full bg-[#7fae8c]/20" />

        {/* the passport card, tilted */}
        <div className="absolute left-1/2 top-1/2 w-[min(460px,88vw)] -translate-x-1/2 -translate-y-1/2 -rotate-6">
          <div className="aspect-[1.6/1] rounded-[28px] bg-[linear-gradient(150deg,#12140f_0%,#1c1f17_55%,#0f120c_100%)] p-8 shadow-[0_60px_120px_-30px_rgba(0,0,0,0.55)]">
            <div className="h-2.5 w-28 rounded-full bg-white/20" />
            <div className="mt-6 h-7 w-52 rounded-full bg-white/30" />
            <div className="mt-3 h-3.5 w-24 rounded-full bg-white/15" />
            <div className="mt-8 flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white/15" />
              <div className="h-6 w-32 rounded-full bg-moss/60" />
            </div>
            <div className="mt-8 h-2 w-full rounded-full bg-white/10" />
            <div className="mt-2 h-2 w-3/4 rounded-full bg-white/10" />
          </div>
        </div>
      </div>

      {/* ---- the glass: blurs everything behind it ---- */}
      <div
        aria-hidden
        className="absolute inset-0 bg-paper/55 backdrop-blur-[60px] backdrop-saturate-150"
      />

      {/* ---- the modal ---- */}
      <div className="animate-in fade-in-0 zoom-in-95 relative z-10 w-full max-w-[420px] rounded-[32px] border border-white/60 bg-white/70 p-10 text-center shadow-[0_40px_100px_-25px_rgba(11,11,11,0.30)] backdrop-blur-2xl duration-700 sm:p-12">
        <p className="eyebrow mb-7">{copy.brand}</p>

        <h1 className="font-display text-[28px] leading-[1.15] text-ink sm:text-[32px]">
          {copy.gate.title}
        </h1>

        <p className="mx-auto mt-4 max-w-[26ch] text-[15px] leading-relaxed text-ink-3">
          {copy.gate.body}
        </p>

        <SignInButton mode="redirect" forceRedirectUrl="/passport">
          <button className="mt-9 w-full rounded-full bg-ink py-3.5 text-sm text-paper shadow-[0_10px_30px_-10px_rgba(11,11,11,0.5)] transition-transform hover:-translate-y-px active:scale-[0.99]">
            {copy.gate.signIn}
          </button>
        </SignInButton>
      </div>
    </main>
  );
}
