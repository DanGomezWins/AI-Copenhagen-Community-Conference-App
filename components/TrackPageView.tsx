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

export function TrackSessionView() {
  return <TrackPageView event={EVENTS.SESSION_PAGE_OPENED} />;
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
