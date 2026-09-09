"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveRating, type RatingState } from "@/app/actions/ratings";
import { track } from "@/lib/track";
import { EVENTS } from "@/lib/analytics";
import CharCount from "@/components/CharCount";

export default function RatingModal({
  label,
  sessionId,
  existingStars,
  existingComment,
  fullWidth = true,
}: {
  label: string;
  sessionId?: string;
  existingStars?: number | null;
  existingComment?: string | null;
  /** The session page wants a full-width primary action; the About page,
   * lower down a page of text, just needs an ordinary button. */
  fullWidth?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState(existingStars ?? 0);
  const [comment, setComment] = useState(existingComment ?? "");
  const [state, action, pending] = useActionState<RatingState, FormData>(
    saveRating,
    {},
  );
  /**
   * Whether the thank-you is showing for THIS opening of the modal.
   *
   * useActionState keeps its result for the life of the component, so gating
   * the panel on state.ok meant that once someone had rated, every reopen
   * showed the thank-you and the form was unreachable - they could never
   * change a rating or edit a comment.
   */
  const [saved, setSaved] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState<string>("90dvh");

  useEffect(() => {
    if (state.ok) {
      setSaved(true);
      track(
        sessionId ? EVENTS.SESSION_RATING_SUBMITTED : EVENTS.APP_RATING_SUBMITTED,
        {
          star_rating: stars,
          has_comment: Boolean(comment),
        },
      );
      const t = setTimeout(() => setOpen(false), 1200);
      return () => clearTimeout(t);
    }
  }, [state.ok, sessionId, stars, comment]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const updateHeight = () => {
      const vv = window.visualViewport;
      if (vv && vv.height) {
        // Use 95% of visual viewport height to leave a small margin
        setViewportHeight(`${vv.height * 0.95}px`);
      }
    };

    updateHeight();

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", updateHeight);
      vv.addEventListener("scroll", updateHeight);
      return () => {
        vv.removeEventListener("resize", updateHeight);
        vv.removeEventListener("scroll", updateHeight);
      };
    }
  }, [open]);

  const already = existingStars != null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          // Reopening returns to the form, carrying the last answer, so it can
          // be changed rather than merely re-read.
          setSaved(false);
          setOpen(true);
        }}
        className={`rounded-lg border border-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-[var(--color-accent)] ${
          fullWidth ? "w-full" : ""
        }`}
      >
        {already ? `${label} — you gave ${existingStars} stars, tap to change` : label}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div
            ref={dialog}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="fixed top-0 left-0 right-0 z-50 flex flex-col rounded-2xl bg-[var(--color-surface)] sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2"
            style={{ maxHeight: viewportHeight }}
          >
            {saved ? (
              <div className="flex flex-1 items-center justify-center overflow-y-auto p-5">
                <div className="py-6 text-center">
                  <p className="text-3xl">🙂</p>
                  <p className="mt-2 font-semibold">Thank you</p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    Your feedback has been saved.
                  </p>
                </div>
              </div>
            ) : (
              <form action={action} className="flex flex-col">
                {sessionId && (
                  <input type="hidden" name="session_id" value={sessionId} />
                )}
                <input type="hidden" name="stars" value={stars} />

                <div className="flex-1 overflow-y-auto p-5">
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
                        className={`transition-colors ${
                          n <= stars
                            ? "text-[var(--color-accent)]"
                            : "text-[var(--color-line)]"
                        }`}
                      >
                        {/* SVG, not the ★/☆ characters - those fall back to
                            whatever symbol font the OS happens to have,
                            which is neither Inter nor the brand colour. */}
                        <svg width="34" height="34" viewBox="0 0 20 20" aria-hidden>
                          {n <= stars ? (
                            <path
                              fill="currentColor"
                              d="M10 1l2.6 6.2 6.7.5-5.1 4.4 1.6 6.5L10 15.3l-5.8 3.3 1.6-6.5-5.1-4.4 6.7-.5z"
                            />
                          ) : (
                            <path
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.3"
                              strokeLinejoin="round"
                              d="M10 1l2.6 6.2 6.7.5-5.1 4.4 1.6 6.5L10 15.3l-5.8 3.3 1.6-6.5-5.1-4.4 6.7-.5z"
                            />
                          )}
                        </svg>
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
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-2.5 text-base outline-none focus:border-[var(--color-accent)]"
                  />
                  <CharCount htmlFor="comment" max={1000} initial={comment.length} />

                  {state.error && (
                    <p className="mt-2 text-sm font-medium text-[var(--color-danger-ink)]" role="alert">
                      {state.error}
                    </p>
                  )}
                </div>

                <div className="flex-shrink-0 border-t border-[var(--color-line)] p-5">
                  <div className="flex gap-2">
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
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </>
  );
}
