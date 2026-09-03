"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveRating, type RatingState } from "@/app/actions/ratings";
import { track } from "@/lib/track";
import { EVENTS } from "@/lib/analytics";

/**
 * Star rating plus an optional comment. Used for the app and for each session —
 * one component so the two never drift apart.
 */
export default function RatingModal({
  label,
  sessionId,
  existingStars,
  existingComment,
}: {
  label: string;
  sessionId?: string;
  existingStars?: number | null;
  existingComment?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState(existingStars ?? 0);
  const [state, action, pending] = useActionState<RatingState, FormData>(
    saveRating,
    {},
  );
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.ok) {
      track(sessionId ? EVENTS.SESSION_RATED : EVENTS.APP_RATED, { stars });
      const t = setTimeout(() => setOpen(false), 1200);
      return () => clearTimeout(t);
    }
  }, [state.ok, sessionId, stars]);

  // Escape closes, as people expect from anything modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  /**
   * Height of the *visible* part of the screen.
   *
   * On a phone, opening the keyboard shrinks the visual viewport but leaves the
   * layout viewport alone. A `fixed inset-0` overlay therefore keeps its full
   * height and the bottom of the sheet — Cancel and Send — ends up underneath
   * the keyboard, unreachable. Testing found exactly that: you could type a
   * comment and then had no way to submit it.
   *
   * Matching the overlay to visualViewport keeps the buttons on screen while
   * the keyboard is up.
   */
  const [viewport, setViewport] = useState<number | null>(null);
  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const sync = () => setViewport(vv.height);
    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      setViewport(null);
    };
  }, [open]);

  const already = existingStars != null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-[var(--color-accent)]"
      >
        {already ? `${label} — you gave ${existingStars}★` : label}
      </button>

      {open && (
        <div
          className="fixed inset-x-0 top-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          style={{ height: viewport ? `${viewport}px` : "100dvh" }}
          onClick={(e) => e.target === dialog.current?.parentElement && setOpen(false)}
        >
          <div
            ref={dialog}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            // max-h + scroll so the sheet can never be taller than what's
            // visible; the buttons stay reachable however small that gets.
            className="max-h-full w-full max-w-sm overflow-y-auto overscroll-contain rounded-t-2xl bg-[var(--color-surface)] p-5 pb-8 sm:rounded-2xl sm:pb-5"
          >
            {state.ok ? (
              <div className="py-6 text-center">
                <p className="text-3xl">★</p>
                <p className="mt-2 font-semibold">Thank you</p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Your feedback has been saved.
                </p>
              </div>
            ) : (
              <form action={action}>
                {sessionId && (
                  <input type="hidden" name="session_id" value={sessionId} />
                )}
                <input type="hidden" name="stars" value={stars} />

                <p className="font-semibold">{label}</p>

                <div
                  className="mt-4 flex justify-center gap-1"
                  role="radiogroup"
                  aria-label="Rating out of five"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={stars === n}
                      aria-label={`${n} star${n > 1 ? "s" : ""}`}
                      onClick={() => setStars(n)}
                      className={`text-4xl leading-none transition-colors ${
                        n <= stars
                          ? "text-[var(--color-accent)]"
                          : "text-[var(--color-line)]"
                      }`}
                    >
                      {n <= stars ? "★" : "☆"}
                    </button>
                  ))}
                </div>

                <label htmlFor="comment" className="mt-5 block text-sm font-medium">
                  We&rsquo;d love to hear your feedback or suggestions — it&rsquo;s anonymous
                </label>
                <textarea
                  id="comment"
                  name="comment"
                  rows={4}
                  maxLength={1000}
                  defaultValue={existingComment ?? ""}
                  className="mt-1 w-full rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-2.5 text-base outline-none focus:border-[var(--color-accent)]"
                />

                {state.error && (
                  <p className="mt-2 text-sm font-medium text-[var(--color-danger-ink)]" role="alert">
                    {state.error}
                  </p>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-lg border border-[var(--color-line)] px-4 py-3 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending || stars === 0}
                    className="flex-1 rounded-lg bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {pending ? "Saving…" : already ? "Update" : "Send"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
