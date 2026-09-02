"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPost, updatePost, type PostFormState } from "@/app/actions/posts";
import { TRACKS } from "@/lib/program";

export default function PostComposer({
  editing,
}: {
  editing?: { id: string; body: string } | null;
}) {
  const router = useRouter();
  const action = editing ? updatePost : createPost;
  const [state, formAction, pending] = useActionState<PostFormState, FormData>(
    action,
    {},
  );
  const [body, setBody] = useState(editing?.body ?? "");
  const [alert, setAlert] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  useEffect(() => {
    if (state.ok) {
      setBody("");
      setAlert(false);
      router.push("/");
    }
  }, [state.ok, router]);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {editing && <input type="hidden" name="id" value={editing.id} />}
      <input type="hidden" name="kind" value={alert ? "alert" : "info"} />

      <div>
        <label htmlFor="body" className="sr-only">Update</label>
        <textarea
          ref={ref}
          id="body"
          name="body"
          required
          rows={5}
          maxLength={1000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Lunch is served in the atrium. Sessions resume at 12:50."
          className="w-full rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-3 text-base leading-relaxed outline-none focus:border-[var(--color-accent)]"
        />
        <p className="mt-1 text-right text-xs text-[var(--color-muted)]">
          {body.length}/1000
        </p>
      </div>

      {!editing && (
        <>
          <fieldset>
            <legend className="text-sm font-medium">
              Who is this for?{" "}
              <span className="font-normal text-[var(--color-muted)]">
                (everyone sees it either way)
              </span>
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              <label>
                <input type="radio" name="track" value="" defaultChecked className="peer sr-only" />
                <span className="block cursor-pointer rounded-full border border-[var(--color-line)] px-3 py-1.5 text-sm peer-checked:border-[var(--color-accent)] peer-checked:text-[var(--color-accent)]">
                  Everyone
                </span>
              </label>
              {TRACKS.map((t) => (
                <label key={t.key}>
                  <input type="radio" name="track" value={t.key} className="peer sr-only" />
                  <span className="block cursor-pointer rounded-full border border-[var(--color-line)] px-3 py-1.5 text-sm peer-checked:border-[var(--color-accent)] peer-checked:text-[var(--color-accent)]">
                    {t.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex items-center gap-3 rounded-lg border border-[var(--color-line)] px-3 py-3">
            <input
              type="checkbox"
              checked={alert}
              onChange={(e) => setAlert(e.target.checked)}
              className="size-4 accent-[var(--color-danger)]"
            />
            <span className="text-sm">
              <span className="font-medium">Mark as an alert</span>
              <span className="block text-xs text-[var(--color-muted)]">
                Highlighted in the feed. Use it sparingly or it stops meaning anything.
              </span>
            </span>
          </label>
        </>
      )}

      {state.error && (
        <p className="text-sm text-[var(--color-danger-ink)]" role="alert">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending || !body.trim()}
        className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-3.5 text-base font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Posting…" : editing ? "Save changes" : "Post to everyone"}
      </button>
    </form>
  );
}
