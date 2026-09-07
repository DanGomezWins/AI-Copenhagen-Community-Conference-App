"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

/**
 * PROTOTYPE ONLY. Not wired to anything.
 *
 * A mock-up of the Open Space topic board (os.codecollab.ai) rendered in this
 * app's own styling, so we can judge whether pulling it in-app is worth doing
 * before anyone writes integration code. Votes and topics live in component
 * state and vanish on reload - nothing is stored, nothing is sent.
 *
 * It sits on the Open Sessions tab itself so it can be judged in place, with
 * a link to the real board directly underneath - a prototype that collects
 * votes nobody counts must never be the only thing on that tab.
 */

type Kind = "ask" | "tell";

type Topic = {
  id: string;
  title: string;
  detail: string;
  kind: Kind;
  slot: string;
  /** Empty means proposed anonymously. */
  proposer: string;
  votes: number;
  mine: boolean;
  /** Only topics you proposed can be edited. */
  createdByMe: boolean;
};

export type Person = { id: string; name: string };

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

const KIND_HELP: Record<Kind, string> = {
  ask: "You have a topic you would like others to help you with",
  tell: "You have an experience you would like to share with others",
};

const SEED: Topic[] = [
  {
    id: "1", kind: "ask", votes: 9, mine: false, createdByMe: false,
    slot: "10:50 – 11:15", proposer: "Freja Lindqvist",
    title: "Getting agents to admit when they are stuck",
    detail:
      "Mine will happily churn for twenty minutes rather than say it cannot do the thing. Has anyone found a prompt, a harness or a stopping rule that actually works?",
  },
  {
    id: "2", kind: "tell", votes: 7, mine: false, createdByMe: false,
    slot: NO_PREFERENCE, proposer: "",
    title: "We replaced our whole RAG stack with one long prompt",
    detail:
      "Six months of chunking, embeddings and a vector database, deleted. Quality went up. Happy to walk through what we cut, what it cost and where it would not work.",
  },
  {
    id: "3", kind: "ask", votes: 6, mine: false, createdByMe: false,
    slot: "13:20 – 13:45", proposer: "Nikolaj Steenbæk",
    title: "What does code review look like when nobody wrote the code?",
    detail:
      "If the diff came from an agent, what is the reviewer actually reviewing? Curious how other teams have changed the ritual, or whether they have at all.",
  },
  {
    id: "4", kind: "tell", votes: 5, mine: false, createdByMe: false,
    slot: "9:30 – 9:55", proposer: "Maja Overgaard Lund",
    title: "Shipping to production on a Friday, agent-assisted",
    detail:
      "What we automated, what we still gate by hand, and the one incident that taught us where the line sits.",
  },
  {
    id: "5", kind: "tell", votes: 4, mine: false, createdByMe: false,
    slot: NO_PREFERENCE, proposer: "Emil Kristoffersen",
    title: "Evals nobody actually runs, and what to do instead",
    detail:
      "We built a beautiful eval suite and looked at it twice. What replaced it was smaller, uglier and used daily.",
  },
  {
    id: "6", kind: "ask", votes: 3, mine: false, createdByMe: false,
    slot: "14:10 – 14:35", proposer: "",
    title: "Where do you draw the line on tool access at work?",
    detail:
      "Shell access, production credentials, the company inbox. Interested in what people genuinely allow versus what the policy says.",
  },
  {
    id: "7", kind: "ask", votes: 1, mine: false, createdByMe: false,
    slot: NO_PREFERENCE, proposer: "Signe Vestergaard Holm",
    title: "Small models on-device: who is genuinely doing it?",
    detail:
      "Plenty of demos, fewer shipped products. If you have one in users' hands, what did you give up to get there?",
  },
];

export default function OpenSessionsPrototype({
  myName,
  people,
}: {
  myName: string;
  people: Person[];
}) {
  const [topics, setTopics] = useState<Topic[]>(SEED);
  const [sort, setSort] = useState<"top" | "new">("top");
  const [open, setOpen] = useState<string | null>(null);
  /** null = closed, "new" = proposing, otherwise the id being edited. */
  const [editing, setEditing] = useState<string | null>(null);

  const byName = useMemo(
    () => new Map(people.map((p) => [p.name.toLowerCase(), p.id])),
    [people],
  );

  const ordered = useMemo(() => {
    const list = [...topics];
    // "New" is newest-first, which for this mock is simply reverse insertion.
    return sort === "top"
      ? list.sort((a, b) => b.votes - a.votes)
      : list.reverse();
  }, [topics, sort]);

  function toggleVote(id: string) {
    setTopics((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, mine: !t.mine, votes: t.votes + (t.mine ? -1 : 1) }
          : t,
      ),
    );
  }

  function save(draft: Draft) {
    if (editing && editing !== "new") {
      setTopics((prev) =>
        prev.map((t) => (t.id === editing ? { ...t, ...draft } : t)),
      );
    } else {
      setTopics((prev) => [
        { ...draft, id: String(Date.now()), votes: 1, mine: true, createdByMe: true },
        ...prev,
      ]);
      setSort("new");
    }
    setEditing(null);
  }

  // Only meaningful under "Top": the cut-off is about rank, not recency.
  const cutoffAfter = sort === "top" ? WINNING : -1;
  const target =
    editing && editing !== "new"
      ? topics.find((t) => t.id === editing) ?? null
      : null;

  return (
    <div className="mt-4">
      <p className="rounded-lg border border-dashed border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-3 text-xs text-[var(--color-accent)]">
        <strong>Prototype.</strong> Sample topics, and votes reset when you
        reload. Nothing here is connected to the real board.
      </p>

      <div className="mt-4 rounded-xl border border-[var(--color-line)] p-3.5">
        <p className="text-sm font-medium">How this works</p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Propose a topic you would like to talk about (Tell) or raise for
          discussion (Ask). Vote for as many as you like. The six with the most
          votes get a room, and the schedule appears here once it is set.
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          {topics.length} topics
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

      <ol className="mt-2 space-y-2">
        {ordered.map((t, i) => {
          const proposerId = t.proposer
            ? byName.get(t.proposer.toLowerCase())
            : undefined;

          return (
            <li key={t.id}>
              <div
                className={`flex items-start gap-3 rounded-xl border p-3.5 ${
                  t.mine
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
                      {t.slot !== NO_PREFERENCE && (
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
                      {t.createdByMe && (
                        <button
                          type="button"
                          onClick={() => setEditing(t.id)}
                          className="mt-2 text-sm font-medium text-[var(--color-accent)]"
                        >
                          Edit your topic
                        </button>
                      )}
                    </div>
                  )}

                  {/* Sits outside the expand button on purpose: it holds a
                      link, and a link inside a button is invalid and
                      unreachable by keyboard. */}
                  <p className="mt-2 text-xs text-[var(--color-muted)]">
                    Proposed by{" "}
                    {!t.proposer ? (
                      <span className="italic">Anonymous</span>
                    ) : proposerId ? (
                      <Link
                        href={`/people/${proposerId}?from=program`}
                        className="font-medium text-[var(--color-accent)]"
                      >
                        {t.proposer}
                      </Link>
                    ) : (
                      <span className="font-medium">{t.proposer}</span>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleVote(t.id)}
                  aria-pressed={t.mine}
                  aria-label={`${t.mine ? "Remove your vote for" : "Vote for"} ${t.title}`}
                  className={`flex shrink-0 flex-col items-center rounded-lg border px-3 py-1.5 transition-colors ${
                    t.mine
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                      : "border-[var(--color-line)] text-[var(--color-muted)]"
                  }`}
                >
                  <span className="text-sm font-semibold tabular-nums">{t.votes}</span>
                  <span className="text-[10px] uppercase tracking-wide">
                    {t.mine ? "Voted" : "Vote"}
                  </span>
                </button>
              </div>

              {/* The line between a room and a mutter in the coffee queue. */}
              {i + 1 === cutoffAfter && (
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
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

type Draft = Omit<Topic, "id" | "votes" | "mine" | "createdByMe">;

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
  onCancel,
  onSave,
}: {
  existing: Topic | null;
  myName: string;
  onCancel: () => void;
  onSave: (draft: Draft) => void;
}) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [detail, setDetail] = useState(existing?.detail ?? "");
  // Prefilled, because most people will use their own name - and the ones who
  // will not are better served by clearing a field than hunting for a checkbox.
  const [proposer, setProposer] = useState(existing ? existing.proposer : myName);
  const [slot, setSlot] = useState<string>(existing?.slot ?? NO_PREFERENCE);
  const [kind, setKind] = useState<Kind>(existing?.kind ?? "ask");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      detail: detail.trim(),
      proposer: proposer.trim(),
      slot,
      kind,
    });
  }

  const field =
    "mt-1 w-full rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-3 text-base outline-none focus:border-[var(--color-accent)]";

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={existing ? "Edit your topic" : "Propose a topic"}
        className="fixed left-0 right-0 top-0 z-50 flex max-h-[95dvh] flex-col rounded-b-2xl bg-[var(--color-surface)] sm:left-1/2 sm:top-8 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:rounded-2xl"
      >
        <form onSubmit={submit} className="flex min-h-0 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <p className="text-lg font-bold">
              {existing ? "Edit your topic" : "Propose a topic"}
            </p>

            <label htmlFor="t-title" className="mt-4 block text-sm font-medium">
              Title
            </label>
            <input
              id="t-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={90}
              autoFocus
              placeholder="What do you want to talk about?"
              className={field}
            />

            <label htmlFor="t-detail" className="mt-4 block text-sm font-medium">
              Description
            </label>
            <textarea
              id="t-detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value.slice(0, DETAIL_MAX))}
              rows={4}
              placeholder="A sentence or two so people know what to expect"
              className={field}
            />
            <p className="mt-1 text-right text-xs text-[var(--color-muted)]">
              {detail.length}/{DETAIL_MAX}
            </p>

            <label htmlFor="t-name" className="mt-3 block text-sm font-medium">
              Your name{" "}
              <span className="font-normal text-[var(--color-muted)]">(optional)</span>
            </label>
            <input
              id="t-name"
              value={proposer}
              onChange={(e) => setProposer(e.target.value)}
              maxLength={60}
              placeholder="Leave blank to propose anonymously"
              className={field}
            />

            <label htmlFor="t-slot" className="mt-4 block text-sm font-medium">
              Preferred time slot{" "}
              <span className="font-normal text-[var(--color-muted)]">(optional)</span>
            </label>
            <select
              id="t-slot"
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              className={field}
            >
              <option value={NO_PREFERENCE}>{NO_PREFERENCE}</option>
              {SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <div className="mt-4 flex gap-1 rounded-full border border-[var(--color-line)] p-0.5">
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
            <p className="mt-1.5 text-sm text-[var(--color-muted)]">
              {KIND_HELP[kind]}
            </p>
          </div>

          <div className="flex shrink-0 gap-2 border-t border-[var(--color-line)] p-5">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-[var(--color-line)] px-4 py-3 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 rounded-lg bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {existing ? "Save changes" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
