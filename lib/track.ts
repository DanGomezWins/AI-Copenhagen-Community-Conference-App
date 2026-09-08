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

    // Events fired as the page goes away need both halves of this.
    //
    // send_instantly takes the event out of the batch queue, which otherwise
    // holds it until the next flush - by which time an installed iOS app has
    // been suspended behind the overlay browser and the queue dies with it.
    // transport then hands it to sendBeacon, which the browser delivers even
    // as the page goes away. Setting only the transport does nothing on its
    // own: it chooses how a request is made, not when.
    posthog.capture(
      event,
      properties,
      options?.onLeave
        ? { send_instantly: true, transport: "sendBeacon" }
        : undefined,
    );
  } catch {
    /* analytics is never load-bearing */
  }
}
