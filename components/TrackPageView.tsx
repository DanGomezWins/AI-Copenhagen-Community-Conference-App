"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";
import { EVENTS, type EventName } from "@/lib/analytics";

export function TrackPageView({ event }: { event: EventName }) {
  useEffect(() => {
    track(event);
  }, [event]);

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

export function TrackProgramView() {
  return <TrackPageView event={EVENTS.PROGRAM_OPENED} />;
}
