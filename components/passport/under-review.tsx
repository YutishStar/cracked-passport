import { SignOutButton } from "@clerk/nextjs";

/** Shown to a signed-in visitor whose verification request is pending. */
export function UnderReview({ status }: { status: "pending" | "rejected" }) {
  const rejected = status === "rejected";
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-moss-soft px-3 py-1.5 text-xs text-moss">
        <span className="h-1.5 w-1.5 rounded-full bg-moss" />
        {rejected ? "Reviewed" : "Under review"}
      </span>
      <h1 className="font-display max-w-md text-3xl leading-tight text-ink">
        {rejected ? "Not this time." : "We're reviewing your request."}
      </h1>
      <p className="mt-4 max-w-sm text-ink-3">
        {rejected
          ? "Your request wasn't approved for this round. Keep building — the door isn't closed forever."
          : "Every Cracked Fellow is verified by hand. We'll let you know the moment you're in — check back here."}
      </p>
      <SignOutButton>
        <button className="mt-8 text-sm text-ink-4 underline underline-offset-4 hover:text-ink-2">
          Sign out
        </button>
      </SignOutButton>
    </main>
  );
}
