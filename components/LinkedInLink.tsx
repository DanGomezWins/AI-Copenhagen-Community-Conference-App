"use client";

import { track } from "@/lib/track";
import { EVENTS } from "@/lib/analytics";

export default function LinkedInLink({ url }: { url: string }) {
  const handleClick = () => {
    track(EVENTS.LINKEDIN_TAP);
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="mt-6 flex items-center justify-between rounded-xl border border-[var(--color-line)] p-3.5"
    >
      <span className="text-sm font-medium text-[var(--color-accent)] underline underline-offset-2">
        LinkedIn
      </span>
      <span className="text-sm text-[var(--color-accent)]">Open ↗</span>
    </a>
  );
}
