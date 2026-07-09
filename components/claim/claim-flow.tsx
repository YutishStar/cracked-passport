"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "motion/react";
import { completeClaim } from "@/app/(auth)/claim/actions";
import { slugifyUsername } from "@/lib/usernames";
import { copy, fmt } from "@/lib/copy";

interface Props {
  token: string;
  fellowNumber: number;
  defaultUsername: string;
}

export function ClaimFlow({ token, fellowNumber, defaultUsername }: Props) {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [username, setUsername] = useState(slugifyUsername(defaultUsername));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onContinue() {
    setBusy(true);
    setError(null);
    const res = await completeClaim(token, username);
    if (res.ok) {
      router.push("/verify");
    } else {
      setError(res.error);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-6 text-center">
      <AnimatePresence mode="wait">
        {!isLoaded ? (
          <motion.div key="loading" className="text-ink-4">
            …
          </motion.div>
        ) : !isSignedIn ? (
          <motion.div
            key="signin"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <p className="eyebrow mb-6">Fellow #{fmt(fellowNumber)}</p>
            <h1 className="font-display text-5xl text-ink">{copy.claim.accepted}</h1>
            <p className="mt-4 text-ink-3">{copy.claim.acceptedBody}</p>
            <SignInButton mode="modal" forceRedirectUrl={window.location.href}>
              <button className="mt-9 rounded-full bg-ink px-7 py-3.5 text-sm text-paper transition-transform hover:-translate-y-px">
                {copy.claim.continue}
              </button>
            </SignInButton>
          </motion.div>
        ) : (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <p className="eyebrow mb-4">Welcome</p>
            <h1 className="font-display text-4xl text-ink">
              {copy.claim.welcome(fellowNumber)}
            </h1>

            <div className="mt-10 text-left">
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
        )}
      </AnimatePresence>
    </div>
  );
}
