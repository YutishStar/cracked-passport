"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

/** Fires the `passport_open` event (matching the marketing site's convention). */
export function PassportOpenTracker({ fellowName }: { fellowName: string }) {
  useEffect(() => {
    posthog.capture("passport_open", { fellow_name: fellowName });
  }, [fellowName]);
  return null;
}
