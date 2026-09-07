"use client";

import Link from "next/link";
import { useActionState, useEffect, useOptimistic, useState, useTransition } from "react";
import { saveTopic, deleteTopic, toggleVote, type TopicState } from "@/app/actions/open-space";

export type Person = { id: string; name: string };

export type Topic = {
  id: string;
  title: string;
  detail: string | null;
  kind: "ask" | "tell";
  slot: string | null;
  /** Null when proposed anonymously. */
  proposer_name: string | null;
  created_at: string;
  votes: number;
  youVoted: boolean;
  yours: boolean;
};

/** The slots Open Sessions run in. */
const SLOTS = [
  "9:30 – 9:55",
  "10:00 – 10:25",
  "10:50 – 11:15",
  "11:20 – 11:45",
  "12:50 – 13:15",
  "13:20 – 13:45",
  "14:10 – 14:35",
  "14:40 – 15:05",
] as const;

const NO_PREFERENCE = "No preference";
const DETAIL_MAX = 400;

/** The six highest-voted topics get a room. */
const WINNING = 6;

export default function OpenSpaceBoard({
  topics,
  myName,
  people,
}: {
  topics: Topic[];
  myName: string;
  people: Person[];
}) {
  const [sort, setSort] = useState<"top" | "new">("top");
  const [open, setOpen] = useState<string | null>(null);
  /** null = closed, "new" = proposing, otherwise the id being edited. */
  const [editing, setEditing] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // A vote should land the moment it is tapped. The server action still runs
  // and revalidates; this only covers the round trip.
  const [shown, applyVote] = useOptimistic(
    topics,
    (current, id: string) =>
      current.map((t) =>
        t.id === id
          ? { ...t, youVoted: !t.youVoted, votes: t.votes + (t.youVoted ? -1 : 1) }
          : t,
      ),
  );

  const byName = new Map(people.map((p) => [p.name.toLowerCase(), p.id]));

  const ordered = [...shown].sort((a, b) =>
    sort === "top"
      ? b.votes - a.votes || a.created_at.localeCompare(b.created_at)
      : b.created_at.localeCompare(a.created_at),
  );

  function vote(t: Topic) {
    const body = new FormData();
    body.set("topic_id", t.id);
    body.set("voted", String(t.youVoted));
    startTransition(() => {
      applyVote(t.id);
      void toggleVote(body);
    });
  }

  // Only meaningful under "Top": the cut-off is about rank, not recency.
  const cutoffAfter = sort === "top" ? WINNING : -1;
  const target =
    editing && editing !== "new"
      ? topics.find((t) => t.id === editing) ?? null
      : null;

  return (
    <div className="mt-4">
      <div className="rounded-xl border border-[var(--color-line)] p-3.5">
        <p className="text-sm font-medium">How this works</p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Propose a topic you would like to talk about (Tell) or raise for
          discussion (Ask). Vote for as many as you like. The six with the most
          votes get a room, and the schedule appears here once it is set.
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          {shown.length} {shown.length === 1 ? "topic" : "topics"}
        </p>
        <div className="flex gap-1 rounded-full border border-[var(--color-line)] p-0.5">
          {(["top", "new"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              aria-pressed={sort === s}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                sort === s
                  ? "bg-[var(--color-accent)] text-white"
                  : "text-[var(--color-muted)]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 && (
        <div className="mt-3 rounded-xl border border-dashed border-[var(--color-line)] p-6 text-center">
          <p className="text-sm font-medium">Nothing proposed yet</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Be the first. Anything you would rather discuss than sit through.
          </p>
        </div>
      )}

      <ol className="mt-2 space-y-2">
        {ordered.map((t, i) => {
          const proposerId = t.proposer_name
            ? byName.get(t.proposer_name.toLowerCase())
            : undefined;

          return (
            <li key={t.id}>
              <div
                className={`flex items-start gap-3 rounded-xl border p-3.5 ${
                  t.youVoted
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
                    : "border-[var(--color-line)]"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setOpen(open === t.id ? null : t.id)}
                    aria-expanded={open === t.id}
                    aria-controls={`topic-detail-${t.id}`}
                    aria-label={`${open === t.id ? "Hide" : "Show"} details for ${t.title}`}
                    className="w-full text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Two hues, one weight: neither kind outranks the other. */}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          t.kind === "tell"
                            ? "bg-[var(--color-tell-soft)] text-[var(--color-tell-ink)]"
                            : "bg-[var(--color-ask-soft)] text-[var(--color-ask-ink)]"
                        }`}
                      >
                        {t.kind}
                      </span>
                      {t.slot && (
                        <span className="font-mono text-[10px] tabular-nums text-[var(--color-muted)]">
                          {t.slot}
                        </span>
                      )}
                      {i < cutoffAfter && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                          In the top {WINNING}
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 flex items-start gap-2">
                      <h3 className="min-w-0 flex-1 font-semibold leading-snug">
                        {t.title}
                      </h3>
                      <svg
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                        className={`mt-0.5 size-4 shrink-0 text-[var(--color-muted)] transition-transform ${
                          open === t.id ? "rotate-180" : ""
                        }`}
                      >
                        <path
                          d="M5 7.5 10 12.5 15 7.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </button>

                  {open === t.id && (
                    <div id={`topic-detail-${t.id}`} className="mt-2">
                      <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                        {t.detail || "No description given."}
                      </p>
                      {t.yours && (
                        <div className="mt-2 flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => setEditing(t.id)}
                            className="text-sm font-medium text-[var(--color-accent)]"
                          >
                            Edit
                          </button>
                          <form action={deleteTopic}>
                            <input type="hidden" name="id" value={t.id} />
                            <button
                              type="submit"
                              className="text-sm font-medium text-[var(--color-danger-ink)]"
                            >
                              Remove
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Outside the expand button on purpose: it holds a link, and
                      a link inside a button is invalid and unreachable by
                      keyboard. */}
                  <p className="mt-2 text-xs text-[var(--color-muted)]">
                    Proposed by{" "}
                    {!t.proposer_name ? (
                      <span className="italic">Anonymous</span>
                    ) : proposerId ? (
                      <Link
                        href={`/people/${proposerId}?from=program&track=open`}
                        className="font-medium text-[var(--color-accent)]"
                      >
                        {t.proposer_name}
                      </Link>
                    ) : (
                      <span className="font-medium">{t.proposer_name}</span>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => vote(t)}
                  aria-pressed={t.youVoted}
                  aria-label={`${t.youVoted ? "Remove your vote for" : "Vote for"} ${t.title}`}
                  className={`flex shrink-0 flex-col items-center rounded-lg border px-3 py-1.5 transition-colors ${
                    t.youVoted
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                      : "border-[var(--color-line)] text-[var(--color-muted)]"
                  }`}
                >
                  <span className="text-sm font-semibold tabular-nums">{t.votes}</span>
                  <span className="text-[10px] uppercase tracking-wide">
                    {t.youVoted ? "Voted" : "Vote"}
                  </span>
                </button>
              </div>

              {/* The line between a room and a mutter in the coffee queue. */}
              {i + 1 === cutoffAfter && i + 1 < ordered.length && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="h-px flex-1 bg-[var(--color-line)]" />
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                    Cut-off
                  </span>
                  <span className="h-px flex-1 bg-[var(--color-line)]" />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        onClick={() => setEditing("new")}
        className="mt-4 w-full rounded-lg border border-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-[var(--color-accent)]"
      >
        + Propose a topic
      </button>

      {editing && (
        <TopicDialog
          key={editing}
          existing={target}
          myName={myName}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

/**
 * The propose/edit form.
 *
 * Top-aligned and internally scrollable rather than centred, for the same
 * reason the rating modal is: on a phone the on-screen keyboard takes the
 * lower half of the viewport, and a centred dialog puts Submit underneath it.
 */
function TopicDialog({
  existing,
  myName,
  onClose,
}: {
  existing: Topic | null;
  myName: string;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<TopicState, FormData>(saveTopic, {});
  const [detail, setDetail] = useState(existing?.detail ?? "");
  const [anon, setAnon] = useState(existing ? !existing.proposer_name : false);
  const [kind, setKind] = useState<"ask" | "tell">(existing?.kind ?? "ask");
  const [name, setName] = useState(existing?.proposer_name ?? myName);

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // py-2.5 rather than py-3, and 16px text so iOS does not zoom on focus.
  const field =
    "mt-1 w-full rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-2.5 text-base outline-none focus:border-[var(--color-accent)]";

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={existing ? "Edit your topic" : "Propose a topic"}
        className="fixed left-0 right-0 top-0 z-50 flex max-h-[95dvh] flex-col rounded-b-2xl bg-[var(--color-surface)] sm:left-1/2 sm:top-8 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:rounded-2xl"
      >
        <form action={action} className="flex min-h-0 flex-col">
          {existing && <input type="hidden" name="id" value={existing.id} />}
          <input type="hidden" name="kind" value={kind} />

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <p className="font-bold">
              {existing ? "Edit your topic" : "Propose a topic"}
            </p>

            <label htmlFor="t-title" className="mt-3 block text-sm font-medium">
              Topic title
            </label>
            <input
              id="t-title"
              name="title"
              defaultValue={existing?.title ?? ""}
              maxLength={90}
              required
              autoFocus
              placeholder="What do you want to talk about?"
              className={field}
            />

            {/* Label and counter share a row rather than stacking: with the
                keyboard up, every line costs. */}
            <div className="mt-3 flex items-baseline justify-between gap-2">
              <label htmlFor="t-detail" className="text-sm font-medium">
                Topic description{" "}
                <span className="font-normal text-[var(--color-muted)]">(optional)</span>
              </label>
              <span className="text-xs tabular-nums text-[var(--color-muted)]">
                {detail.length}/{DETAIL_MAX}
              </span>
            </div>
            <textarea
              id="t-detail"
              name="detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value.slice(0, DETAIL_MAX))}
              rows={2}
              placeholder="A sentence or two so people know what to expect"
              className={field}
            />

            <label htmlFor="t-name" className="mt-3 block text-sm font-medium">
              Your name
            </label>
            <input
              id="t-name"
              name="proposer_name"
              value={anon ? "" : name}
              onChange={(e) => setName(e.target.value)}
              disabled={anon}
              maxLength={60}
              placeholder={anon ? "Anonymous" : "Your name"}
              className={`${field} disabled:opacity-50`}
            />
            <label className="mt-2 flex items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                name="anon"
                checked={anon}
                onChange={(e) => setAnon(e.target.checked)}
                className="size-4 accent-[var(--color-accent)]"
              />
              Post anonymously
            </label>

            <label htmlFor="t-slot" className="mt-3 block text-sm font-medium">
              Preferred time slot{" "}
              <span className="font-normal text-[var(--color-muted)]">(optional)</span>
            </label>
            <select
              id="t-slot"
              name="slot"
              defaultValue={existing?.slot ?? NO_PREFERENCE}
              className={field}
            >
              <option value={NO_PREFERENCE}>{NO_PREFERENCE}</option>
              {SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <div className="mt-3 flex gap-1 rounded-full border border-[var(--color-line)] p-0.5">
              {(["ask", "tell"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  aria-pressed={kind === k}
                  className={`flex-1 rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                    kind === k
                      ? k === "tell"
                        ? "bg-[var(--color-tell-soft)] text-[var(--color-tell-ink)]"
                        : "bg-[var(--color-ask-soft)] text-[var(--color-ask-ink)]"
                      : "text-[var(--color-muted)]"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>

            {state.error && (
              <p
                role="alert"
                className="mt-3 rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-3 text-sm font-medium text-[var(--color-danger-ink)]"
              >
                {state.error}
              </p>
            )}
          </div>

          <div className="flex shrink-0 gap-2 border-t border-[var(--color-line)] p-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[var(--color-line)] px-4 py-2.5 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {pending ? "Saving…" : existing ? "Save changes" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
