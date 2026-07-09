"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { markSeen } from "@/app/(passport)/actions";
import { copy } from "@/lib/copy";
import type { StampView } from "@/lib/supabase/queries/passport";

export function StampGrid({
  stamps,
  canMarkSeen = false,
}: {
  stamps: StampView[];
  canMarkSeen?: boolean;
}) {
  const marked = useRef(false);
  const hasNew = stamps.some((s) => s.is_new);

  useEffect(() => {
    if (canMarkSeen && hasNew && !marked.current) {
      marked.current = true;
      // Let the press animation play before clearing the "new" flag server-side.
      const t = setTimeout(() => void markSeen(), 1800);
      return () => clearTimeout(t);
    }
  }, [canMarkSeen, hasNew]);

  if (stamps.length === 0) {
    return <p className="text-ink-4">{copy.passport.emptyStamps}</p>;
  }

  return (
    <div className="flex flex-wrap gap-5">
      {stamps.map((s, i) => (
        <motion.div
          key={s.id}
          initial={s.is_new ? { scale: 1.6, opacity: 0, rotate: -18 } : false}
          animate={{ scale: 1, opacity: 1, rotate: rotationFor(i) }}
          transition={
            s.is_new
              ? { type: "spring", stiffness: 260, damping: 12, delay: 0.1 }
              : { duration: 0.3 }
          }
          className="flex h-24 w-24 flex-col items-center justify-center rounded-full border-2 border-moss/45 bg-moss-soft/60 text-center"
          style={{ rotate: `${rotationFor(i)}deg` }}
        >
          <span className="text-2xl">{s.flag ?? "◦"}</span>
          <span className="mt-1 px-2 font-mono text-[9px] uppercase leading-tight tracking-wide text-moss">
            {s.name}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/** Small deterministic tilt so stamps look hand-pressed, not gridded. */
function rotationFor(i: number): number {
  const seq = [-6, 4, -3, 7, -5, 2];
  return seq[i % seq.length];
}
