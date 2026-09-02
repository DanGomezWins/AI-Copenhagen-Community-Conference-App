"use client";

import { useOptimistic, startTransition } from "react";
import { toggleStar } from "@/app/actions/stars";
import { track } from "@/lib/track";
import { EVENTS } from "@/lib/analytics";

/**
 * Star toggle for My Schedule.
 *
 * Optimistic, because at a conference you tap this while walking. Waiting for
 * a round trip before the star fills makes it feel like the tap missed, and
 * people tap again.
 */
export default function StarButton({
  sessionId,
  starred,
  size = "md",
}: {
  sessionId: string;
  starred: boolean;
  size?: "sm" | "md";
}) {
  const [optimistic, setOptimistic] = useOptimistic(starred);

  const dimension = size === "sm" ? "size-8" : "size-10";
  const glyph = size === "sm" ? "text-base" : "text-xl";

  return (
    <form
      action={(formData) => {
        startTransition(() => setOptimistic(!optimistic));
        track(optimistic ? EVENTS.SESSION_UNSTARRED : EVENTS.SESSION_STARRED, { sessionId });
        return toggleStar(formData);
      }}
    >
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="starred" value={String(optimistic)} />
      <button
        type="submit"
        aria-pressed={optimistic}
        aria-label={optimistic ? "Remove from My Schedule" : "Add to My Schedule"}
        className={`${dimension} flex shrink-0 items-center justify-center rounded-full transition-colors ${
          optimistic
            ? "text-[var(--color-accent)]"
            : "text-[var(--color-line)] hover:text-[var(--color-muted)]"
        }`}
      >
        <span className={glyph} aria-hidden="true">
          {optimistic ? "★" : "☆"}
        </span>
      </button>
    </form>
  );
}
