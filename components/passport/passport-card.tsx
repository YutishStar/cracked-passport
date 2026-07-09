"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { copy, fmt } from "@/lib/copy";

export interface PassportCardProps {
  displayName: string;
  fellowNumber: number;
  username?: string | null;
  currentHouse?: { name: string; flag: string | null } | null;
  mrz: [string, string];
  avatarUrl?: string | null;
  interactive?: boolean;
}

export function PassportCard({
  displayName,
  fellowNumber,
  username,
  currentHouse,
  mrz,
  avatarUrl,
  interactive = true,
}: PassportCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rx = useSpring(useTransform(py, [-0.5, 0.5], [6, -6]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(px, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 20 });

  function onMove(e: React.PointerEvent) {
    if (!interactive || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onLeave() {
    px.set(0);
    py.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX: interactive ? rx : 0, rotateY: interactive ? ry : 0, transformPerspective: 1000 }}
      className="relative w-full overflow-hidden rounded-[28px] border border-black/10 bg-[linear-gradient(150deg,#12140f_0%,#1c1f17_55%,#0f120c_100%)] p-8 text-paper shadow-[0_30px_80px_-30px_rgba(0,0,0,0.5)]"
    >
      {/* header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
            Cracked · Passport
          </p>
          <p className="mt-3 font-display text-3xl leading-tight">{displayName}</p>
          {username && <p className="mt-1 text-sm text-white/50">@{username}</p>}
        </div>
        <div className="text-right">
          <span className="font-pixel text-5xl leading-none text-white">
            #{fmt(fellowNumber)}
          </span>
        </div>
      </div>

      {/* avatar + verified seal */}
      <div className="mt-7 flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/15 bg-white/5">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-pixel text-2xl text-white/40">
              {displayName.slice(0, 1)}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-moss/25 px-2.5 py-1 text-xs text-[#9fd4ac]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#9fd4ac]" />
            {copy.passport.statusVerified}
          </span>
          {currentHouse && (
            <span className="text-sm text-white/60">
              {currentHouse.flag} {currentHouse.name}
            </span>
          )}
        </div>
      </div>

      {/* MRZ footer */}
      <div className="mt-8 border-t border-white/10 pt-4">
        <pre className="whitespace-pre-wrap break-all font-mono text-[10px] leading-relaxed text-white/40">
          {mrz[0]}
          {"\n"}
          {mrz[1]}
        </pre>
      </div>
    </motion.div>
  );
}
