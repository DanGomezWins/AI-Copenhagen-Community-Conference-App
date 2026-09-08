"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";
import { EVENTS, type EventName } from "@/lib/analytics";

export function TrackPageView({
  event,
  properties,
}: {
  event: EventName;
  properties?: Record<string, unknown>;
}) {
  // Stringified so the effect re-runs when the values change, not the object
  // identity - otherwise switching tabs would record only the first one.
  const key = JSON.stringify(properties ?? null);
  useEffect(() => {
    track(event, properties ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, key]);

  return null;
}

/**
 * Carries the room the session belongs to. Without it, "how many people opened
 * a demo page" cannot be asked at all - and that is the denominator for the
 * product-link rate, which is the clearest commercial signal in the app.
 */
export function TrackSessionView({ track: view }: { track: string }) {
  return (
    <TrackPageView event={EVENTS.SESSION_PAGE_OPENED} properties={{ track: view }} />
  );
}

export function TrackProfileView({ fromSearch }: { fromSearch?: boolean } = {}) {
  useEffect(() => {
    track(EVENTS.PROFILE_VIEW, fromSearch ? { from_search: true } : undefined);
  }, [fromSearch]);

  return null;
}

/**
 * Carries which room is being viewed. Without it "opened the programme" cannot
 * distinguish someone who glanced at Main stage from someone who worked
 * through every room - which is the difference the aha-moment cohort turns on.
 */
export function TrackProgramView({ track: view }: { track: string }) {
  return <TrackPageView event={EVENTS.PROGRAM_OPENED} properties={{ track: view }} />;
}
