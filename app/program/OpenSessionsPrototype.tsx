"use client";

import { useMemo, useState } from "react";

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

type Kind = "tell" | "ask";
type Topic = {
  id: string;
  title: string;
  detail: string;
  kind: Kind;
  votes: number;
  mine: boolean;
};

const SEED: Topic[] = [
  {
    id: "1", kind: "ask", votes: 9, mine: false,
    title: "Getting agents to admit when they are stuck",
    detail:
      "Mine will happily churn for twenty minutes rather than say it cannot do the thing. Has anyone found a prompt, a harness or a stopping rule that actually works?",
  },
  {
    id: "2", kind: "tell", votes: 7, mine: false,
    title: "We replaced our whole RAG stack with one long prompt",
    detail:
      "Six months of chunking, embeddings and a vector database, deleted. Quality went up. Happy to walk through what we cut, what it cost and where it would not work.",
  },
  {
    id: "3", kind: "ask", votes: 6, mine: false,
    title: "What does code review look like when nobody wrote the code?",
    detail:
      "If the diff came from an agent, what is the reviewer actually reviewing? Curious how other teams have changed the ritual, or whether they have at all.",
  },
  {
    id: "4", kind: "tell", votes: 5, mine: false,
    title: "Shipping to production on a Friday, agent-assisted",
    detail:
      "What we automated, what we still gate by hand, and the one incident that taught us where the line sits.",
  },
  {
    id: "5", kind: "tell", votes: 4, mine: false,
    title: "Evals nobody actually runs, and what to do instead",
    detail:
      "We built a beautiful eval suite and looked at it twice. What replaced it was smaller, uglier and used daily.",
  },
  {
    id: "6", kind: "ask", votes: 3, mine: false,
    title: "Where do you draw the line on tool access at work?",
    detail:
      "Shell access, production credentials, the company inbox. Interested in what people genuinely allow versus what the policy says.",
  },
  {
    id: "7", kind: "ask", votes: 1, mine: false,
    title: "Small models on-device: who is genuinely doing it?",
    detail:
      "Plenty of demos, fewer shipped products. If you have one in users' hands, what did you give up to get there?",
  },
];
/** The six highest-voted topics get a room. */
const WINNING = 6;

export default function OpenSessionsPrototype() {
  const [topics, setTopics] = useState<Topic[]>(SEED);
  const [sort, setSort] = useState<"top" | "new">("top");
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftKind, setDraftKind] = useState<Kind>("tell");
  const [draftDetail, setDraftDetail] = useState("");
  const [open, setOpen] = useState<string | null>(null);

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

  function propose(e: React.FormEvent) {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    setTopics((prev) => [
      {
        id: String(Date.now()),
        title,
        detail: draftDetail.trim(),
        kind: draftKind,
        votes: 1,
        mine: true,
      },
      ...prev,
    ]);
    setDraft("");
    setDraftDetail("");
    setComposing(false);
    setSort("new");
  }

  // Only meaningful under "Top": the cut-off line is about rank, not recency.
  const cutoffAfter = sort === "top" ? WINNING : -1;

  return (
    <div className="mt-4">
      <p className="rounded-lg border border-dashed border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-3 text-xs text-[var(--color-accent)]">
        <strong>Prototype.</strong> Sample topics, and votes reset when you
        reload. Nothing here is connected to the real board.
      </p>

      <div className="mt-4 rounded-xl border border-[var(--color-line)] p-3.5">
        <p className="text-sm font-medium">How this works</p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Suggest anything you would rather talk about than listen to. Vote for
          as many as you like &mdash; the {WINNING} with the most votes get a
          room, and the schedule appears here once it is set.
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
        {ordered.map((t, i) => (
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
                  // The chevron is decorative and the heading inside does not
                  // name the control, so screen readers announced an unlabelled
                  // button. Say what it opens.
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
                  <p
                    id={`topic-detail-${t.id}`}
                    className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]"
                  >
                    {t.detail || "No description given."}
                  </p>
                )}
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
        ))}
      </ol>

      {composing ? (
        <form
          onSubmit={propose}
          className="mt-4 rounded-xl border border-[var(--color-accent)] p-3.5"
        >
          <label htmlFor="topic" className="block text-sm font-medium">
            Your topic
          </label>
          <input
            id="topic"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={90}
            autoFocus
            placeholder="Something you would rather discuss than sit through"
            className="mt-1 w-full rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-3 text-base outline-none focus:border-[var(--color-accent)]"
          />

          <label htmlFor="detail" className="mt-3 block text-sm font-medium">
            A bit more{" "}
            <span className="font-normal text-[var(--color-muted)]">(optional)</span>
          </label>
          <textarea
            id="detail"
            value={draftDetail}
            onChange={(e) => setDraftDetail(e.target.value)}
            rows={3}
            maxLength={400}
            placeholder="What you want to get into, and why it is worth an hour."
            className="mt-1 w-full rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-2.5 text-base outline-none focus:border-[var(--color-accent)]"
          />

          <div className="mt-3 flex gap-2">
            {(["tell", "ask"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setDraftKind(k)}
                aria-pressed={draftKind === k}
                className={`rounded-full border px-3 py-1.5 text-sm capitalize ${
                  draftKind === k
                    ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                    : "border-[var(--color-line)] text-[var(--color-muted)]"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-[var(--color-muted)]">
            <strong>Tell</strong> if you want to share something,{" "}
            <strong>Ask</strong> if you want to hear from others. You will not be
            asked to facilitate it.
          </p>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setComposing(false)}
              className="flex-1 rounded-lg border border-[var(--color-line)] px-4 py-3 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!draft.trim()}
              className="flex-1 rounded-lg bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              Add topic
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setComposing(true)}
          className="mt-4 w-full rounded-lg border border-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-[var(--color-accent)]"
        >
          + Propose a topic
        </button>
      )}
    </div>
  );
}
