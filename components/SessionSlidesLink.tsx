"use client";

import { track } from "@/lib/track";
import { EVENTS } from "@/lib/analytics";

export default function SessionSlidesLink({ url }: { url: string }) {
  const handleClick = () => {
    track(EVENTS.SLIDES_DOWNLOAD_TAPPED);
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="mt-4 flex items-center justify-between rounded-xl border border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-3.5"
    >
      <span className="text-sm font-semibold text-[var(--color-accent)]">
        Download the slides (PDF)
      </span>
      <span className="text-sm text-[var(--color-accent)]">↓</span>
    </a>
  );
}
