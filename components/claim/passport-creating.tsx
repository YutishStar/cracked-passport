"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { getPassportStatus } from "@/app/(passport)/actions";
import { copy, fmt } from "@/lib/copy";

export function PassportCreating({ fellowNumber }: { fellowNumber: number }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  // Poll issuance status; stub mode returns ready quickly.
  useEffect(() => {
    let alive = true;
    let tries = 0;
    const tick = async () => {
      const { status } = await getPassportStatus();
      tries += 1;
      if (!alive) return;
      if (status === "issued" || status === "deferred" || tries > 15) {
        // Hold the animation a beat so it feels intentional.
        setTimeout(() => alive && setReady(true), 1400);
      } else {
        setTimeout(tick, 1200);
      }
    };
    tick();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <AnimatePresence mode="wait">
        {!ready ? (
          <motion.div
            key="creating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="mx-auto mb-8 h-1 w-40 overflow-hidden rounded-full bg-black/[0.06]"
              aria-hidden
            >
              <motion.div
                className="h-full bg-moss"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
              />
            </motion.div>
            <p className="font-display text-3xl text-ink">{copy.claim.creating}</p>
          </motion.div>
        ) : (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="eyebrow mb-4"
            >
              Fellow #{fmt(fellowNumber)}
            </motion.p>
            <h1 className="font-display text-5xl text-ink">{copy.claim.created}</h1>
            <p className="mt-4 text-ink-3">{copy.claim.createdWelcome(fellowNumber)}</p>
            <button
              onClick={() => router.push("/passport")}
              className="mt-9 rounded-full bg-ink px-7 py-3.5 text-sm text-paper transition-transform hover:-translate-y-px"
            >
              {copy.claim.enter}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
