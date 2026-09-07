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
import OpenSpaceBoard, { type Topic } from "./OpenSpaceBoard";

export const dynamic = "force-dynamic";

type OpenTopicRow = {
  id: string;
  title: string;
  detail: string | null;
  kind: string;
  slot: string | null;
  proposer_name: string | null;
  created_by: string;
  created_at: string;
};

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

  const [
    { data: sessionRows },
    { data: starRows },
    { data: settings },
    { data: profiles },
    { data: topicRows },
    { data: voteRows },
  ] =
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
        .select("moderator_main_id, moderator_demos_id, moderator_open_id")
        .maybeSingle(),
      supabase.from("profiles").select("id, first_name, last_name, role, company"),
      // Only needed on the Open Sessions tab, but fetched in the same round
      // trip rather than a second waterfall after the view is known.
      view === "open"
        ? supabase.from("open_topics").select("*").order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as OpenTopicRow[] }),
      view === "open"
        ? supabase.from("open_topic_votes").select("topic_id, profile_id")
        : Promise.resolve({ data: [] as { topic_id: string; profile_id: string }[] }),
    ]);

  const starred = new Set((starRows ?? []).map((r) => r.session_id));
  const all = (sessionRows ?? []) as Session[];

  // My Schedule draws from every room, in one chronological run.
  const sessions =
    view === MY_SCHEDULE ? all.filter((s) => starred.has(s.id)) : all;

  const state = liveness(sessions);

  // Role and company come from the speaker's profile, matched on name - the
  // same way the session page resolves its speaker card.
  const people = profiles ?? [];
  const byName = new Map(
    people.map((p) => [nameKey(`${p.first_name} ${p.last_name}`), p]),
  );

  // Auto-fills the proposer's name in the topic form; they can clear it to
  // stay anonymous.
  const me = user ? people.find((p) => p.id === user.id) : null;
  const myName = me ? `${me.first_name} ${me.last_name}` : "";

  // So a topic's proposer can link through to their profile.
  const directory = people.map((p) => ({
    id: p.id,
    name: `${p.first_name} ${p.last_name}`,
  }));

  // Counts and "did I vote" are derived here rather than in the database: the
  // board is small, and one pass beats a view plus a second query.
  const votes = voteRows ?? [];
  const topics: Topic[] = (topicRows ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    detail: t.detail,
    kind: t.kind === "tell" ? "tell" : "ask",
    slot: t.slot,
    proposer_name: t.proposer_name,
    created_at: t.created_at,
    votes: votes.filter((v) => v.topic_id === t.id).length,
    youVoted: Boolean(user) && votes.some((v) => v.topic_id === t.id && v.profile_id === user!.id),
    yours: Boolean(user) && t.created_by === user!.id,
  }));

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
                href={`/people/${moderator.id}?from=program&track=${view}`}
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

      {/* Open Sessions are not a fixed programme: attendees propose topics and
          vote, and the highest-voted get a room. So this tab is the board
          rather than a list of sessions. */}
      {view === "open" && (
        <OpenSpaceBoard topics={topics} myName={myName} people={directory} />
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
