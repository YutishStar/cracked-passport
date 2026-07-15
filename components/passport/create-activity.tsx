"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { createActivityAction } from "@/app/(passport)/activity-actions";
import type { ActivityKind } from "@/lib/supabase/types";

const ADMIN_KINDS: { value: ActivityKind; label: string }[] = [
  { value: "hackathon", label: "Hackathon" },
  { value: "luma", label: "Event (Luma)" },
  { value: "house", label: "House activity" },
  { value: "activity", label: "Activity" },
];

/**
 * Creates a claimable activity and hands back a link to share. Fellows use the
 * `build_post` variant to publish what they're building today; admins get the
 * full set (hackathon / Luma / house / activity).
 */
export function CreateActivity({ mode }: { mode: "admin" | "build_post" }) {
  const [pending, startTransition] = useTransition();
  const [kind, setKind] = useState<ActivityKind>(
    mode === "build_post" ? "build_post" : "hackathon",
  );
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [claimUrl, setClaimUrl] = useState<string | null>(null);

  function submit() {
    startTransition(async () => {
      const res = await createActivityAction({
        kind,
        title,
        body: body || undefined,
        link_url: link || undefined,
      });
      if (res.ok) {
        setClaimUrl(res.claimUrl);
        setTitle("");
        setBody("");
        setLink("");
        toast.success(
          mode === "build_post" ? "Posted. Share the link." : "Activity created.",
        );
      } else {
        toast.error(res.error);
      }
    });
  }

  const cls =
    "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-ink placeholder:text-ink-4 outline-none transition-colors focus:border-ink/40";

  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white p-5">
      <p className="eyebrow mb-4">
        {mode === "build_post" ? "What are you building today?" : "Create a claimable activity"}
      </p>

      <div className="space-y-3">
        {mode === "admin" && (
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as ActivityKind)}
            className={cls}
          >
            {ADMIN_KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        )}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            mode === "build_post" ? "Shipped the passport claim flow" : "Da Nang Hackathon"
          }
          className={cls}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder={mode === "build_post" ? "A line about it…" : "What was it?"}
          className={cls}
        />
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Link (repo, demo, Luma page)"
          className={cls}
        />

        <button
          onClick={submit}
          disabled={pending || !title.trim()}
          className="w-full rounded-full bg-ink py-3 text-sm text-paper transition-transform hover:-translate-y-px disabled:opacity-40"
        >
          {pending ? "…" : mode === "build_post" ? "Post it" : "Create + get claim link"}
        </button>
      </div>

      <AnimatePresence>
        {claimUrl && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 overflow-hidden"
          >
            <p className="eyebrow mb-2">Share this — anyone who took part can claim</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={claimUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 rounded-lg border border-black/10 bg-paper-soft px-3 py-2 font-mono text-xs text-ink-2"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(claimUrl);
                  toast.success("Link copied.");
                }}
                className="rounded-lg bg-ink px-4 py-2 text-sm text-paper"
              >
                Copy
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
