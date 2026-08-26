"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveSession, deleteSession, type SessionFormState } from "@/app/actions/sessions";
import { TRACKS, isoToTime, type Session } from "@/lib/program";

const field =
  "mt-1 w-full rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-3 text-base outline-none focus:border-[var(--color-accent)]";

export default function SessionForm({ session }: { session?: Session | null }) {
  const [state, action, pending] = useActionState<SessionFormState, FormData>(
    saveSession,
    {},
  );
  const editing = Boolean(session);

  return (
    <>
      <form action={action} className="mt-6 space-y-5">
        {session && <input type="hidden" name="id" value={session.id} />}

        <fieldset>
          <legend className="text-sm font-medium">Track</legend>
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
              defaultValue={isoToTime(session?.starts_at ?? null)}
              className={field}
            />
          </div>
          <div>
            <label htmlFor="end_time" className="block text-sm font-medium">Ends</label>
            <input
              id="end_time"
              name="end_time"
              type="time"
              defaultValue={isoToTime(session?.ends_at ?? null)}
              className={field}
            />
          </div>
        </div>
        <p className="-mt-2 text-xs text-[var(--color-muted)]">
          Thursday 10 September, Copenhagen time.
        </p>

        <div>
          <label htmlFor="room" className="block text-sm font-medium">
            Room{" "}
            <span className="font-normal text-[var(--color-muted)]">
              (defaults to the track&rsquo;s room)
            </span>
          </label>
          <input
            id="room"
            name="room"
            defaultValue={session?.room ?? ""}
            placeholder="Auditorium"
            className={field}
          />
        </div>

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

        {state.error && <p className="text-sm text-red-600" role="alert">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-3.5 font-semibold text-white disabled:opacity-60"
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
