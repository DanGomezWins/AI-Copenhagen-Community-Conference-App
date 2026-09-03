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
  labelled = false,
}: {
  sessionId: string;
  starred: boolean;
  size?: "sm" | "md";
  /**
   * Spell out what the star does. In a dense list the glyph alone is fine
   * because it repeats down the page and the pattern is obvious. On a session
   * page it appears exactly once, and testing showed people simply did not see
   * it — a pale outline star in the corner reads as decoration. There, say so.
   */
  labelled?: boolean;
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
      className={labelled ? "mt-5" : undefined}
    >
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="starred" value={String(optimistic)} />
      <button
        type="submit"
        aria-pressed={optimistic}
        aria-label={optimistic ? "Remove from My Schedule" : "Add to My Schedule"}
        className={
          labelled
            ? `flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
                optimistic
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                  : "border-[var(--color-line)] text-[var(--color-ink)]"
              }`
            : `${dimension} flex shrink-0 items-center justify-center rounded-full transition-colors ${
                optimistic
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              }`
        }
      >
        <span className={labelled ? "text-lg" : glyph} aria-hidden="true">
          {optimistic ? "★" : "☆"}
        </span>
        {labelled && (optimistic ? "In My Schedule" : "Add to My Schedule")}
      </button>
    </form>
  );
}
