"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { saveSession, deleteSession, type SessionFormState } from "@/app/actions/sessions";
import { TRACKS, isoToTime, type Session } from "@/lib/program";

const field =
  "mt-1 w-full rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-3 text-base outline-none focus:border-[var(--color-accent)]";

const DEFAULT_MINUTES = 25; // 20 minute talk + 5 minutes of questions

function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return "";
  const t = (h * 60 + m + minutes + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

function minutesBetween(a: string, b: string): number | null {
  if (!a || !b) return null;
  const [ah, am] = a.split(":").map(Number);
  const [bh, bm] = b.split(":").map(Number);
  if ([ah, am, bh, bm].some(Number.isNaN)) return null;
  return bh * 60 + bm - (ah * 60 + am);
}

export default function SessionForm({ session }: { session?: Session | null }) {
  const [state, action, pending] = useActionState<SessionFormState, FormData>(
    saveSession,
    {},
  );
  const editing = Boolean(session);

  const [start, setStart] = useState(isoToTime(session?.starts_at ?? null));
  const [end, setEnd] = useState(isoToTime(session?.ends_at ?? null));

  /**
   * Moving the start drags the end with it, preserving the session's length.
   * Without this, rescheduling a 09:30 session to 16:45 leaves the end at 09:55
   * and the save is rejected as "end before start" — which is exactly how a
   * reschedule silently failed in testing.
   */
  function onStartChange(next: string) {
    const duration = minutesBetween(start, end) ?? DEFAULT_MINUTES;
    setStart(next);
    if (next) setEnd(addMinutes(next, duration > 0 ? duration : DEFAULT_MINUTES));
  }

  const endsBeforeStart =
    Boolean(start && end) && (minutesBetween(start, end) ?? 1) <= 0;

  return (
    <>
      <form action={action} className="mt-6 space-y-5">
        {session && <input type="hidden" name="id" value={session.id} />}

        <fieldset>
          <legend className="text-sm font-medium">
            Room{" "}
            <span className="font-normal text-[var(--color-muted)]">
              (there are three, and each one is a track)
            </span>
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {TRACKS.map((t) => (
              <label key={t.key}>
                <input
                  type="radio"
                  name="track"
                  value={t.key}
                  defaultChecked={(session?.track ?? "main") === t.key}
                  className="peer sr-only"
                />
                <span className="block cursor-pointer rounded-full border border-[var(--color-line)] px-3 py-1.5 text-sm peer-checked:border-[var(--color-accent)] peer-checked:text-[var(--color-accent)]">
                  {t.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="title" className="block text-sm font-medium">Title</label>
          <input id="title" name="title" required defaultValue={session?.title ?? ""} className={field} />
        </div>

        <div>
          <label htmlFor="speaker_name" className="block text-sm font-medium">
            Speaker{" "}
            <span className="font-normal text-[var(--color-muted)]">
              (leave blank for breaks)
            </span>
          </label>
          <input
            id="speaker_name"
            name="speaker_name"
            defaultValue={session?.speaker_name ?? ""}
            className={field}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="start_time" className="block text-sm font-medium">Starts</label>
            <input
              id="start_time"
              name="start_time"
              type="time"
              required
              value={start}
              onChange={(e) => onStartChange(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label htmlFor="end_time" className="block text-sm font-medium">Ends</label>
            <input
              id="end_time"
              name="end_time"
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className={`${field} ${endsBeforeStart ? "border-red-500" : ""}`}
            />
          </div>
        </div>
        <p className="-mt-2 text-xs text-[var(--color-muted)]">
          Thursday 10 September, Copenhagen time. Moving the start moves the end
          with it.
        </p>

        {endsBeforeStart && (
          <p className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm font-medium text-red-600">
            The end time is before the start time. Fix it before saving.
          </p>
        )}

        {editing && (
          <label className="flex items-start gap-3 rounded-lg border border-[var(--color-line)] px-3 py-3">
            <input
              type="checkbox"
              name="announce"
              defaultChecked
              className="mt-0.5 size-4 accent-[var(--color-accent)]"
            />
            <span className="text-sm">
              <span className="font-medium">Tell attendees</span>
              <span className="block text-xs text-[var(--color-muted)]">
                Posts a schedule-change notice to the feed. Only fires if the time or
                room actually changed &mdash; fixing a typo won&rsquo;t notify anyone.
              </span>
            </span>
          </label>
        )}

        {/* Errors sit directly above the button and are impossible to miss —
            a quiet line of red text mid-form got overlooked in testing. */}
        {state.error && (
          <p
            role="alert"
            className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm font-medium text-red-600"
          >
            {state.error}
          </p>
        )}

        {/* A clash warns rather than blocks — on the day an organiser may
            genuinely need an overlap — but it has to be unmissable, and it has
            to make clear the save DID go through. */}
        {state.warning && (
          <div
            role="status"
            className="rounded-lg border-2 border-amber-500 bg-amber-500/10 p-4"
          >
            <p className="font-semibold text-amber-700 dark:text-amber-400">
              ⚠ Two sessions in the same room at the same time
            </p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
              {state.warning}
            </p>
            <Link
              href="/admin/schedule"
              className="mt-3 inline-block rounded-lg bg-amber-600 px-3.5 py-2 text-sm font-medium text-white"
            >
              Back to the schedule
            </Link>
          </div>
        )}

        <button
          type="submit"
          disabled={pending || endsBeforeStart}
          className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-3.5 font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : editing ? "Save changes" : "Add session"}
        </button>
      </form>

      {session && (
        <div className="mt-8 border-t border-[var(--color-line)] pt-6">
          <form action={deleteSession}>
            <input type="hidden" name="id" value={session.id} />
            <button type="submit" className="text-sm font-medium text-red-600">
              Delete this session
            </button>
          </form>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Cancelling is usually better &mdash; it keeps the slot visible so attendees
            aren&rsquo;t left wondering where it went.
          </p>
          <Link
            href="/admin/schedule"
            className="mt-4 inline-block text-sm text-[var(--color-muted)] underline"
          >
            Cancel
          </Link>
        </div>
      )}
    </>
  );
}
