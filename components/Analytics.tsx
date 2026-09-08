"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { track } from "@/lib/track";
import { EVENTS } from "@/lib/analytics";

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
  const search = useSearchParams();
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

  /**
   * Whether this is the installed app or a browser tab, recorded once per
   * launch.
   *
   * Needs no service worker or platform check: a Home Screen app reports
   * display-mode standalone, and iOS additionally sets navigator.standalone.
   * Worth knowing because installing is what makes notifications work, so the
   * split between installed and browser explains a lot of other numbers.
   */
  useEffect(() => {
    if (!key || !posthog.__loaded) return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) track(EVENTS.HOME_SCREEN_LAUNCH);
  }, [key]);

  /**
   * A notification open, flagged by the service worker as ?from=push.
   *
   * Recorded here rather than in the worker because a worker has no window and
   * cannot reach the analytics client. Fires once per arrival: the parameter is
   * stripped from the address bar immediately, so a refresh does not count
   * twice and the URL stays clean if the person shares it.
   */
  useEffect(() => {
    if (!key || !posthog.__loaded) return;
    if (search?.get("from") !== "push") return;

    track(EVENTS.NOTIFICATION_OPENED, { path: pathname });

    const url = new URL(window.location.href);
    url.searchParams.delete("from");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  }, [key, search, pathname]);

  // One pageview per route change, since this is a single-page app.
  useEffect(() => {
    if (!key || !posthog.__loaded) return;
    posthog.capture("$pageview", { path: pathname });
  }, [pathname, key]);

  return null;
}
