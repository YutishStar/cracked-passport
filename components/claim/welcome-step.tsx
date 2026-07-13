"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { completeOnboarding } from "@/app/(passport)/actions";
import { slugifyUsername } from "@/lib/usernames";
import { copy } from "@/lib/copy";

/** Self-serve welcome: an approved fellow picks their public handle. */
export function WelcomeStep({
  fellowNumber,
  defaultUsername,
}: {
  fellowNumber: number;
  defaultUsername: string;
}) {
  const router = useRouter();
  const [username, setUsername] = useState(slugifyUsername(defaultUsername));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onContinue() {
    setBusy(true);
    setError(null);
    const res = await completeOnboarding(username);
    if (res.ok) {
      router.push("/verify");
    } else {
      setError(res.error);
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-6"
    >
      <p className="eyebrow mb-4">Welcome</p>
      <h1 className="font-display text-4xl text-ink">{copy.claim.welcome(fellowNumber)}</h1>

      <div className="mt-10">
        <label className="eyebrow mb-2 block">{copy.claim.usernameLabel}</label>
        <div className="flex items-center rounded-xl border border-black/10 bg-white px-4 py-3">
          <span className="text-ink-4">passport.crackedhq.com/</span>
          <input
            value={username}
            onChange={(e) => setUsername(slugifyUsername(e.target.value))}
            className="min-w-0 flex-1 bg-transparent text-ink outline-none"
            autoCapitalize="none"
            spellCheck={false}
          />
        </div>
        <p className="mt-2 text-xs text-ink-4">{copy.claim.usernameHint}</p>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>

      <button
        onClick={onContinue}
        disabled={busy || username.length < 3}
        className="mt-8 w-full rounded-full bg-ink py-3.5 text-sm text-paper transition-transform hover:-translate-y-px disabled:opacity-50"
      >
        {busy ? "…" : copy.claim.welcomeContinue}
      </button>
    </motion.div>
  );
}
