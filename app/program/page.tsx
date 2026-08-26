import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  TRACKS, isTrackKey, timeRange, isStructural, liveness,
  type Session, type TrackKey,
} from "@/lib/program";

export const dynamic = "force-dynamic";

export default async function ProgramPage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string }>;
}) {
  const { track: raw } = await searchParams;
  const track: TrackKey = isTrackKey(raw) ? raw : "main";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("track", track)
    .order("starts_at", { ascending: true });

  const sessions = (data ?? []) as Session[];
  const state = liveness(sessions);
  const meta = TRACKS.find((t) => t.key === track)!;

  return (
    <section>
      <h1 className="text-2xl font-bold tracking-tight">Program</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Thursday 10 September · twoday København
      </p>

      <nav className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {TRACKS.map((t) => (
          <Link
            key={t.key}
            href={`/program?track=${t.key}`}
            scroll={false}
            aria-current={t.key === track ? "page" : undefined}
            className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              t.key === track
                ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                : "border-[var(--color-line)] text-[var(--color-muted)]"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <p className="mt-3 text-xs text-[var(--color-muted)]">{meta.room}</p>

      {error && (
        <p className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm">
          Couldn’t load the program. {error.message}
        </p>
      )}

      {!error && sessions.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-[var(--color-line)] p-6">
          <p className="text-sm text-[var(--color-muted)]">
            Nothing scheduled on this track yet.
            {track === "open" && " Open sessions are set during the day — check back."}
          </p>
        </div>
      )}

      <ol className="mt-4 space-y-2">
        {sessions.map((s) => (
          <SessionRow key={s.id} session={s} state={state.get(s.id) ?? "upcoming"} />
        ))}
      </ol>
    </section>
  );
}

function SessionRow({
  session: s,
  state,
}: {
  session: Session;
  state: "past" | "now" | "next" | "upcoming";
}) {
  const cancelled = s.status === "cancelled";

  if (isStructural(s)) {
    return (
      <li className="flex items-center gap-3 px-1 py-2">
        <span className="shrink-0 font-mono text-xs tabular-nums text-[var(--color-muted)]">
          {timeRange(s.starts_at, s.ends_at)}
        </span>
        <span className="text-sm text-[var(--color-muted)]">{s.title}</span>
        <span className="h-px flex-1 bg-[var(--color-line)]" />
      </li>
    );
  }

  return (
    <li
      className={`rounded-xl border p-3.5 transition-opacity ${
        state === "now"
          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5"
          : "border-[var(--color-line)]"
      } ${state === "past" ? "opacity-55" : ""}`}
    >
      <div className="flex items-baseline gap-3">
        <span className="shrink-0 font-mono text-xs tabular-nums text-[var(--color-muted)]">
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
        {cancelled && (
          <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-600">
            Cancelled
          </span>
        )}
      </div>

      <h2 className={`mt-1.5 font-semibold leading-snug ${cancelled ? "line-through opacity-60" : ""}`}>
        {s.title}
      </h2>

      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {s.speaker_name}
        {s.room && <span className="text-[var(--color-muted)]"> · {s.room}</span>}
      </p>
    </li>
  );
}
