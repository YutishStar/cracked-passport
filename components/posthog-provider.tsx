"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { MotionConfig } from "motion/react";

/** Top-level client providers: analytics + global reduced-motion. */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || posthog.__loaded) return;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: true,
    });
  }, []);

  return (
    <PHProvider client={posthog}>
      {/* reducedMotion="user" → all motion respects prefers-reduced-motion. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </PHProvider>
  );
}
