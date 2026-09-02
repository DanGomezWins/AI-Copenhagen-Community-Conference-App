import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SessionCard from "@/components/SessionCard";
import {
  TRACKS, MY_SCHEDULE, isProgramView, liveness,
  type Session, type ProgramView,
} from "@/lib/program";
import { EVENT } from "@/lib/event";

export const dynamic = "force-dynamic";

const VIEWS = [
  ...TRACKS.map((t) => ({ key: t.key as ProgramView, label: t.label })),
  { key: MY_SCHEDULE as ProgramView, label: "My Schedule" },
];

export default async function ProgramPage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string }>;
}) {
  const { track: raw } = await searchParams;
  const view: ProgramView = isProgramView(raw) ? raw : "main";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: sessionRows }, { data: starRows }, { data: settings }] =
    await Promise.all([
      view === MY_SCHEDULE
        ? supabase.from("sessions").select("*").order("starts_at", { ascending: true })
        : supabase.from("sessions").select("*").eq("track", view)
            .order("starts_at", { ascending: true }),
      user
        ? supabase.from("session_stars").select("session_id").eq("profile_id", user.id)
        : Promise.resolve({ data: [] as { session_id: string }[] }),
      supabase.from("app_settings").select("open_sessions_url").maybeSingle(),
    ]);

  const starred = new Set((starRows ?? []).map((r) => r.session_id));
  const all = (sessionRows ?? []) as Session[];

  // My Schedule draws from every room, in one chronological run.
  const sessions =
    view === MY_SCHEDULE ? all.filter((s) => starred.has(s.id)) : all;

  const state = liveness(sessions);
  const openUrl = settings?.open_sessions_url ?? null;

  return (
    <section>
      <h1 className="text-2xl font-bold tracking-tight">Program</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {EVENT.date} · {EVENT.venue}
      </p>

      <nav className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {VIEWS.map((v) => (
          <Link
            key={v.key}
            href={`/program?track=${v.key}`}
            scroll={false}
            aria-current={v.key === view ? "page" : undefined}
            className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              v.key === view
                ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                : "border-[var(--color-line)] text-[var(--color-muted)]"
            }`}
          >
            {v.key === MY_SCHEDULE ? `★ ${v.label}` : v.label}
          </Link>
        ))}
      </nav>

      {/* Open Sessions are scheduled on a separate site, so this tab points
          out rather than listing anything of its own. */}
      {view === "open" && (
        <div className="mt-4 rounded-xl border border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4">
          <p className="font-semibold">Open Sessions are published separately</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            The open sessions schedule is decided during the day and lives on its
            own page.
          </p>
          {openUrl ? (
            <a
              href={openUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block rounded-lg bg-[var(--color-accent)] px-3.5 py-2 text-sm font-medium text-white"
            >
              Open the schedule ↗
            </a>
          ) : (
            <p className="mt-3 text-sm font-medium">
              The link will appear here as soon as that page is live.
            </p>
          )}
        </div>
      )}

      {view === MY_SCHEDULE && sessions.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-[var(--color-line)] p-6">
          <p className="text-sm font-medium">Nothing starred yet</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Tap the ☆ on any session and it appears here, across all rooms, in
            the order you&rsquo;ll attend them.
          </p>
        </div>
      )}

      {view !== "open" && view !== MY_SCHEDULE && sessions.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-[var(--color-line)] p-6">
          <p className="text-sm text-[var(--color-muted)]">
            Nothing scheduled on this track yet.
          </p>
        </div>
      )}

      {sessions.length > 0 && (
        <ol className="mt-4 space-y-2">
          {sessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              state={state.get(s.id) ?? "upcoming"}
              starred={starred.has(s.id)}
              showTrack={view === MY_SCHEDULE}
              from={view === MY_SCHEDULE ? "mine" : view}
            />
          ))}
        </ol>
      )}
    </section>
  );
}
