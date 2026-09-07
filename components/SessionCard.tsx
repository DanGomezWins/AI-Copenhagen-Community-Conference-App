import Link from "next/link";
import StarButton from "@/components/StarButton";
import { timeRange, isStructural, TRACKS, type Session } from "@/lib/program";
import type { Liveness } from "@/lib/program";

/**
 * One session in a list. Used by the Program, My Schedule and profile pages so
 * a session looks and behaves the same everywhere.
 */
export default function SessionCard({
  session: s,
  state,
  starred,
  showTrack = false,
  from,
  speaker,
}: {
  session: Session;
  state: Liveness;
  starred: boolean;
  showTrack?: boolean;
  from?: string;
  /** Role and company for the speaker, when they have a profile. */
  speaker?: { role: string | null; company: string | null };
}) {
  const cancelled = s.status === "cancelled";
  const track = TRACKS.find((t) => t.key === s.track)?.label;

  // Everyone on stage, not just the lead - the closing keynote has three, and
  // naming one of them made the other two look like they were not appearing.
  const names = [s.speaker_name, ...(s.co_speaker_names ?? [])].filter(
    (n): n is string => Boolean(n),
  );
  const solo = names.length === 1;
  const billing =
    names.length > 2
      ? `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`
      : names.join(" & ");

  return (
    <li
      className={`flex items-start gap-2 rounded-xl border p-3.5 transition-opacity ${
        state === "now"
          ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
          : "border-[var(--color-line)]"
      } ${
        // A finished session is unmistakably finished: it fades back so the
        // eye lands on what is still to come.
        state === "past" ? "opacity-45" : ""
      }`}
    >
      <Link
        href={`/session/${s.id}${from ? `?from=${from}` : ""}`}
        className="min-w-0 flex-1"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs tabular-nums text-[var(--color-muted)]">
            {timeRange(s.starts_at, s.ends_at)}
          </span>
          {state === "now" && (
            <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Now
            </span>
          )}
          {state === "next" && (
            <span className="rounded-full border border-[var(--color-accent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
              Next
            </span>
          )}
          {state === "past" && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Finished
            </span>
          )}
          {cancelled && (
            <span className="rounded-full bg-[var(--color-danger-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-danger-ink)]">
              Cancelled
            </span>
          )}
          {showTrack && track && (
            <span className="rounded-full bg-[var(--color-raised)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-muted)]">
              {track}
            </span>
          )}
        </div>

        <h3
          className={`mt-1.5 font-semibold leading-snug ${
            cancelled ? "line-through opacity-60" : ""
          }`}
        >
          {s.title}
        </h3>

        {names.length > 0 && (
          <>
            <p className="mt-1 text-sm font-medium">{billing}</p>
            {/* Role and company sit on their own line, one step quieter. On a
                phone this is the difference between a card you can skim and a
                paragraph you have to read - which is also why a session with
                several speakers lists the names only. Three roles and three
                companies is a paragraph. */}
            {solo && (speaker?.role || speaker?.company) && (
              <p className="text-xs leading-snug text-[var(--color-muted)]">
                {[speaker.role, speaker.company].filter(Boolean).join(" · ")}
              </p>
            )}
          </>
        )}

        {s.slides_url && (
          <p className="mt-1.5 text-sm font-medium text-[var(--color-accent)]">
            Slides available ↓
          </p>
        )}
      </Link>

      {/* Breaks, lunch and registration are day structure, not something you
          choose to attend, so they carry no star. */}
      {!cancelled && !isStructural(s) && (
        <StarButton sessionId={s.id} starred={starred} />
      )}
    </li>
  );
}
