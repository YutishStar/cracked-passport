"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { claimCertificate } from "@/app/(passport)/activity-actions";
import type { ActivityKind } from "@/lib/supabase/types";

const KIND_LABEL: Record<ActivityKind, string> = {
  hackathon: "Hackathon",
  luma: "Event",
  house: "House",
  activity: "Activity",
  build_post: "Build",
};

export function ClaimCertificate({
  activityId,
  code,
  kind,
  title,
  body,
  linkUrl,
  claimCount,
  alreadyClaimed,
}: {
  activityId: string;
  code: string;
  kind: ActivityKind;
  title: string;
  body: string | null;
  linkUrl: string | null;
  claimCount: number;
  alreadyClaimed: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">(
    alreadyClaimed ? "done" : "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function onClaim() {
    setState("busy");
    setError(null);
    const res = await claimCertificate(activityId, code);
    if (res.ok) {
      setState("done");
    } else {
      setError(res.error);
      setState("error");
    }
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-6 py-16 text-center">
      <p className="eyebrow mb-5">{KIND_LABEL[kind]} · Certificate</p>

      <h1 className="font-display text-[34px] leading-tight text-ink">{title}</h1>
      {body && <p className="mt-4 text-ink-3">{body}</p>}

      {linkUrl && (
        <a
          href={linkUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 text-sm text-moss underline underline-offset-4"
        >
          View it ↗
        </a>
      )}

      <p className="mt-6 font-mono text-xs uppercase tracking-widest text-ink-4">
        {claimCount} {claimCount === 1 ? "person has" : "people have"} claimed this
      </p>

      <AnimatePresence mode="wait">
        {state === "done" ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 18 }}
            className="mt-10"
          >
            {/* the stamp thuds in */}
            <div className="mx-auto flex h-28 w-28 rotate-[-6deg] flex-col items-center justify-center rounded-full border-2 border-moss/50 bg-moss-soft/70">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-moss)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 5 5L20 7" />
              </svg>
              <span className="mt-1 font-mono text-[9px] uppercase tracking-wider text-moss">
                Claimed
              </span>
            </div>
            <p className="mt-6 text-ink-2">It&apos;s on your Passport.</p>
            <button
              onClick={() => router.push("/passport")}
              className="mt-6 rounded-full bg-ink px-7 py-3.5 text-sm text-paper transition-transform hover:-translate-y-px"
            >
              Open your Passport
            </button>
          </motion.div>
        ) : (
          <motion.div key="claim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-10">
            <button
              onClick={onClaim}
              disabled={state === "busy"}
              className="w-full rounded-full bg-ink py-4 text-sm text-paper transition-transform hover:-translate-y-px disabled:opacity-50"
            >
              {state === "busy" ? "Claiming…" : "Claim your certificate"}
            </button>
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
            <p className="mt-4 text-xs text-ink-4">
              Free — we cover everything. It lands on your Passport forever.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
