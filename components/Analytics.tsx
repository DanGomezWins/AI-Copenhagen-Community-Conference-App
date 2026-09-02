"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";

/**
 * PostHog, EU cloud.
 *
 * Chosen over GA4 because this is an EU event with EU attendees: the data
 * stays in Frankfurt, which removes the transfer question entirely.
 *
 * Configured to be defensible without a cookie banner:
 *   - person_profiles "identified_only": anonymous visitors are not profiled
 *   - no session recording, no autocapture of clicks or form contents
 *   - IP addresses are not stored
 * We record the events we chose deliberately, listed in lib/analytics.ts, and
 * nothing else.
 */
export default function Analytics({ distinctId }: { distinctId?: string | null }) {
  const pathname = usePathname();
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

  useEffect(() => {
    if (!key) return;
    if (typeof window === "undefined") return;

    if (!posthog.__loaded) {
      posthog.init(key, {
        api_host: host,
        person_profiles: "identified_only",
        capture_pageview: false, // sent manually below, so route changes count
        autocapture: false,
        disable_session_recording: true,
        ip: false,
        persistence: "localStorage",
      });
    }

    if (distinctId) posthog.identify(distinctId);
  }, [key, host, distinctId]);

  // One pageview per route change, since this is a single-page app.
  useEffect(() => {
    if (!key || !posthog.__loaded) return;
    posthog.capture("$pageview", { path: pathname });
  }, [pathname, key]);

  return null;
}
