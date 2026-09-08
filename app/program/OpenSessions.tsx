import { EVENT } from "@/lib/event";
import TrackedLink from "@/components/TrackedLink";
import { EVENTS } from "@/lib/analytics";

export type AgendaItem = {
  id: string;
  title: string;
  description: string | null;
  facilitator: string | null;
  slot: string | null;
  kind: "ask" | "tell" | null;
};

/**
 * The Open Space tab.
 *
 * Proposing and voting happen on the Open Space platform, which has its own
 * backend for running the day. This app shows the agenda once it is locked in
 * and pushed to /api/open-sessions, and links out until then.
 *
 * Names are rendered as plain text on purpose. The source has one name field,
 * not a first and last, and topics can be proposed anonymously - so matching
 * them to profiles would be guesswork that occasionally credits the wrong
 * person.
 */
/**
 * Shown until the Open Space platform pushes the real thing. Rendered exactly
 * as a real agenda is, so what you see before the day is what you get on it -
 * behind a label, so nobody mistakes it for the schedule.
 */
const PLACEHOLDER: AgendaItem[] = [
  {
    id: "eg-1", kind: "ask", slot: "10:50 - 11:15",
    title: "Getting agents to admit when they are stuck",
    description:
      "Mine will churn for twenty minutes rather than say it cannot do the thing. Has anyone found a stopping rule that works?",
    facilitator: "Freja Lindqvist",
  },
  {
    id: "eg-2", kind: "tell", slot: "11:20 - 11:45",
    title: "We replaced our whole RAG stack with one long prompt",
    description:
      "Six months of chunking, embeddings and a vector database, deleted. Quality went up.",
    facilitator: null,
  },
  {
    id: "eg-3", kind: "ask", slot: "13:20 - 13:45",
    title: "Where do you draw the line on tool access at work?",
    description: null,
    facilitator: "Nikolaj Steenbaek",
  },
];

export default function OpenSessions({
  agenda,
  boardUrl,
}: {
  agenda: AgendaItem[];
  boardUrl: string | null;
}) {
  return (
    <div className="mt-4">
      {agenda.length === 0 ? (
        <>
          <div className="rounded-xl border border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4">
            <p className="font-semibold">The schedule is still being decided</p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Open Sessions are chosen by you on the day. Propose a topic you
              want to talk about, vote for the ones you want to hear, and the
              most popular get a room. It is all done on the Open Space board.
            </p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              The final schedule appears here once voting closes, expected late
              morning.
            </p>
          </div>

          {boardUrl && <BoardLink url={boardUrl} primary />}

          <div className="mt-6 flex items-center gap-2">
            <span className="h-px flex-1 bg-[var(--color-line)]" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Example only
            </span>
            <span className="h-px flex-1 bg-[var(--color-line)]" />
          </div>
          <p className="mt-2 text-center text-xs text-[var(--color-muted)]">
            Roughly how the schedule will look. These are not real topics and
            will be replaced.
          </p>

          <ol className="mt-3 space-y-2 opacity-60">
            {PLACEHOLDER.map((item) => (
              <AgendaCard key={item.id} item={item} />
            ))}
          </ol>
        </>
      ) : (
        <>
          <ol className="space-y-2">
            {agenda.map((item) => (
              <AgendaCard key={item.id} item={item} />
            ))}
          </ol>
          {boardUrl && <BoardLink url={boardUrl} primary={false} />}
        </>
      )}

      <p className="mt-3 text-center text-xs text-[var(--color-muted)]">
        Open Sessions run at {EVENT.venue}, alongside the Demos track.
      </p>
    </div>
  );
}

/**
 * Where proposing and voting actually happen.
 *
 * Sits directly under the explainer while there is no schedule - that is the
 * moment it is a call to action - and below the agenda once one exists, when
 * it is only a reference.
 */
function BoardLink({ url, primary }: { url: string; primary: boolean }) {
  return (
    <TrackedLink
      href={url}
      event={EVENTS.OPEN_SPACE_BOARD_TAPPED}
      properties={{ before_schedule: primary }}
      className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[var(--color-accent)] p-3.5"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[var(--color-accent)]">
          {primary ? "Propose and vote on topics" : "Open Space board"}
        </span>
        <span className="block text-xs text-[var(--color-muted)]">
          Opens the Open Space board in your browser
        </span>
      </span>
      <span className="shrink-0 text-sm text-[var(--color-accent)]">Open ↗</span>
    </TrackedLink>
  );
}

/** One agenda row. Shared so the example cannot drift from the real thing. */
function AgendaCard({ item }: { item: AgendaItem }) {
  return (
    <li className="rounded-xl border border-[var(--color-line)] p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        {item.kind && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              item.kind === "tell"
                ? "bg-[var(--color-tell-soft)] text-[var(--color-tell-ink)]"
                : "bg-[var(--color-ask-soft)] text-[var(--color-ask-ink)]"
            }`}
          >
            {item.kind}
          </span>
        )}
        {item.slot && (
          <span className="font-mono text-xs tabular-nums text-[var(--color-muted)]">
            {item.slot}
          </span>
        )}
      </div>

      <h3 className="mt-1.5 font-semibold leading-snug">{item.title}</h3>

      {item.description && (
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-muted)]">
          {item.description}
        </p>
      )}

      {item.facilitator && (
        <p className="mt-2 text-xs text-[var(--color-muted)]">{item.facilitator}</p>
      )}
    </li>
  );
}
