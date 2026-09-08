"use client";

import posthog from "posthog-js";
import type { EventName } from "./analytics";

/**
 * Records one event. Deliberately forgiving: analytics must never be the reason
 * something a user asked for fails, so a missing key or a blocked request is
 * silently ignored rather than thrown.
 */
export function track(
  event: EventName,
  properties?: Record<string, unknown>,
  options?: { onLeave?: boolean },
): void {
  try {
    if (typeof window === "undefined") return;
    if (!posthog.__loaded) return;

    // Events fired as the page goes away need sendBeacon. PostHog batches over
    // XHR, and tapping an outbound link backgrounds the app - on an installed
    // iOS app the link opens in an overlay browser and the request is dropped
    // with the page. The browser queues a beacon and delivers it regardless,
    // which is the difference between a metric and an empty tile.
    posthog.capture(
      event,
      properties,
      options?.onLeave ? { transport: "sendBeacon" } : undefined,
    );
  } catch {
    /* analytics is never load-bearing */
  }
}
