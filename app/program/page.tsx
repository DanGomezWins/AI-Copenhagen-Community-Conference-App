import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SessionCard from "@/components/SessionCard";
import { TrackProgramView } from "@/components/TrackPageView";
import {
  TRACKS, MY_SCHEDULE, isProgramView, liveness,
  type Session, type ProgramView,
} from "@/lib/program";
import { EVENT } from "@/lib/event";
import { nameKey } from "@/lib/names";
import OpenSessionsPrototype from "./OpenSessionsPrototype";

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

  const [{ data: sessionRows }, { data: starRows }, { data: settings }, { data: profiles }] =
    await Promise.all([
      view === MY_SCHEDULE
        ? supabase.from("sessions").select("*").order("starts_at", { ascending: true })
        : supabase.from("sessions").select("*").eq("track", view)
            .order("starts_at", { ascending: true }),
      user
        ? supabase.from("session_stars").select("session_id").eq("profile_id", user.id)
        : Promise.resolve({ data: [] as { session_id: string }[] }),
      supabase
        .from("app_settings")
        .select("open_sessions_url, moderator_main_id, moderator_demos_id, moderator_open_id")
        .maybeSingle(),
      supabase.from("profiles").select("id, first_name, last_name, role, company"),
    ]);

  const starred = new Set((starRows ?? []).map((r) => r.session_id));
  const all = (sessionRows ?? []) as Session[];

  // My Schedule draws from every room, in one chronological run.
  const sessions =
    view === MY_SCHEDULE ? all.filter((s) => starred.has(s.id)) : all;

  const state = liveness(sessions);
  const openUrl = settings?.open_sessions_url ?? null;

  // Role and company come from the speaker's profile, matched on name - the
  // same way the session page resolves its speaker card.
  const people = profiles ?? [];
  const byName = new Map(
    people.map((p) => [nameKey(`${p.first_name} ${p.last_name}`), p]),
  );

  const moderatorId =
    view === "main" ? settings?.moderator_main_id
    : view === "demos" ? settings?.moderator_demos_id
    : view === "open" ? settings?.moderator_open_id
    : null;
  const moderator = moderatorId
    ? people.find((p) => p.id === moderatorId) ?? null
    : null;

  return (
    <section>
      <TrackProgramView />

      {/* Sticks under the app header so the room you are looking at stays on
          screen. Scrolling a long programme otherwise loses which tab is
          selected within a couple of swipes. Bleeds full-width so nothing
          shows through at the edges as content passes beneath. */}
      <div
        style={{ top: "var(--app-header-h)" }}
        className="sticky z-30 -mx-4 -mt-4 border-b border-[var(--color-line)] bg-[var(--color-surface)]/95 px-4 pt-4 backdrop-blur"
      >
        <h1 className="text-2xl font-bold tracking-tight">Program</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {EVENT.date} · {EVENT.venue}
        </p>

        <nav className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
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

        {/* Named under the tabs, because the question "who do I ask in this
            room?" is asked in the room, not on a separate page. */}
        <p className="mt-2.5 pb-3 text-xs text-[var(--color-muted)]">
          {moderator ? (
            <>
              Moderated by{" "}
              <Link
                href={`/people/${moderator.id}?from=program`}
                className="font-medium text-[var(--color-accent)]"
              >
                {moderator.first_name} {moderator.last_name}
              </Link>
            </>
          ) : view === MY_SCHEDULE ? (
            <span className="opacity-0">.</span>
          ) : (
            "Moderator to be confirmed"
          )}
        </p>
      </div>

      {/* Open Sessions are scheduled on a separate site, so this tab points
          out rather than listing anything of its own. */}
      {/* Prototype of an in-app topic board, off the normal path: attendees on
          the Open Sessions tab still get the link out. See the component. */}
      {/* The topic board, in-app. Still a prototype: nothing it collects is
          stored, so the real board stays linked underneath rather than being
          replaced outright - if this is still here when attendees arrive, they
          can reach the board that actually counts. */}
      {view === "open" && (
        <>
          <OpenSessionsPrototype />

          <div className="mt-6 rounded-xl border border-[var(--color-line)] p-4">
            <p className="text-sm font-medium">The board that counts</p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Topics and votes above are a trial and are not recorded. Suggest
              and vote on the real board.
            </p>
            {openUrl ? (
              <a
                href={openUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block rounded-lg bg-[var(--color-accent)] px-3.5 py-2 text-sm font-medium text-white"
              >
                Open the real board ↗
              </a>
            ) : (
              <p className="mt-3 text-sm font-medium">
                The link will appear here as soon as that page is live.
              </p>
            )}
          </div>
        </>
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
              speaker={
                s.speaker_name ? byName.get(nameKey(s.speaker_name)) : undefined
              }
            />
          ))}
        </ol>
      )}
    </section>
  );
}
