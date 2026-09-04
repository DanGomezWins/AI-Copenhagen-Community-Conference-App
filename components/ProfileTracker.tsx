"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";
import { EVENTS } from "@/lib/analytics";

export default function ProfileTracker({ fromSearch }: { fromSearch?: boolean }) {
  useEffect(() => {
    track(EVENTS.PROFILE_VIEW, fromSearch ? { from_search: true } : undefined);
  }, [fromSearch]);

  return null;
}

export function LinkedInTracker() {
  const handleClick = () => {
    track(EVENTS.LINKEDIN_TAP);
  };

  return { onClick: handleClick };
}
