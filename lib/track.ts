"use client";

import posthog from "posthog-js";
import type { EventName } from "./analytics";

/**
 * Records one event. Deliberately forgiving: analytics must never be the reason
 * something a user asked for fails, so a missing key or a blocked request is
 * silently ignored rather than thrown.
 */
export function track(event: EventName, properties?: Record<string, unknown>): void {
  try {
    if (typeof window === "undefined") return;
    if (!posthog.__loaded) return;
    posthog.capture(event, properties);
  } catch {
    /* analytics is never load-bearing */
  }
}
