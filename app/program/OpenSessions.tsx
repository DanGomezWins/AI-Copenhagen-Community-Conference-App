import { EVENT } from "@/lib/event";
import TrackedLink from "@/components/TrackedLink";
import { EVENTS } from "@/lib/analytics";
import { VIEW_COLORS } from "@/lib/program";

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

/** One agenda row, exactly as the Open Space platform sends it. */
function AgendaCard({ item }: { item: AgendaItem }) {
  return (
    // Carries the Open sessions colour down the left edge, the same as a
    // session card in any other room. The Ask/Tell badge keeps its own pair of
    // hues - those say what kind of topic it is, not which room it is in.
    <li
      className="rounded-xl border border-[var(--color-line)] p-3.5"
      style={{
        borderLeftColor: `var(${VIEW_COLORS.open.edge})`,
        borderLeftWidth: "3px",
      }}
    >
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
