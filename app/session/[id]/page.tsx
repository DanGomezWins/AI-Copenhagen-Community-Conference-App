import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SpeakerCard, { type SpeakerProfile } from "@/components/SpeakerCard";
import StarButton from "@/components/StarButton";
import RatingModal from "@/components/RatingModal";
import { TrackSessionView } from "@/components/TrackPageView";
import SessionSlidesLink from "@/components/SessionSlidesLink";
import { TRACKS, timeRange, liveness, type Session } from "@/lib/program";
import { nameKey } from "@/lib/names";
import { SLIDES_ENABLED } from "@/lib/slides";
import TrackedLink from "@/components/TrackedLink";
import { EVENTS } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export default async function SessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const supabase = await createClient();

  const [{ data: session }, { data: { user } }] = await Promise.all([
    supabase.from("sessions").select("*").eq("id", id).maybeSingle(),
    supabase.auth.getUser(),
  ]);

  if (!session) notFound();
  const s = session as Session;

  const [{ data: profiles }, { data: star }, { data: myRating }] =
    await Promise.all([
      supabase.from("profiles").select("id, first_name, last_name, photo_url, role, company"),
      user
        ? supabase.from("session_stars").select("session_id")
            .eq("profile_id", user.id).eq("session_id", id).maybeSingle()
        : Promise.resolve({ data: null }),
      user
        ? supabase.from("ratings").select("stars, comment")
            .eq("profile_id", user.id).eq("session_id", id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const find = (name: string) =>
    (profiles ?? []).find(
      (p) => nameKey(`${p.first_name} ${p.last_name}`) === nameKey(name),
    ) as SpeakerProfile | undefined;

  // The lead first, then anyone sharing the stage. The closing keynote has
  // three; a single card would silently drop two of them.
  const names = [s.speaker_name, ...(s.co_speaker_names ?? [])].filter(
    (n): n is string => Boolean(n),
  );
  const speakers = names.map(find).filter((p): p is SpeakerProfile => Boolean(p));
  const unlisted = names.filter((n) => !find(n));

  const state = liveness([s]).get(s.id) ?? "upcoming";
  const track = TRACKS.find((t) => t.key === s.track)?.label;
  const finished = state === "past";

  const back =
    from === "mine"
      ? { href: "/program?track=mine", label: "My Schedule" }
      : from && TRACKS.some((t) => t.key === from)
        ? { href: `/program?track=${from}`, label: "Program" }
        : { href: "/program", label: "Program" };

  return (
    <section>
      <TrackSessionView />
      <Link href={back.href} className="text-sm text-[var(--color-muted)]">
        ← {back.label}
      </Link>

      <div className="mt-4 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm tabular-nums text-[var(--color-muted)]">
              {timeRange(s.starts_at, s.ends_at)}
            </span>
            {track && (
              <span className="rounded-full bg-[var(--color-raised)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-muted)]">
                {track}
              </span>
            )}
            {state === "now" && (
              <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                Now
              </span>
            )}
            {s.status === "cancelled" && (
              <span className="rounded-full bg-[var(--color-danger-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-danger-ink)]">
                Cancelled
              </span>
            )}
          </div>

          <h1
            className={`mt-2 text-2xl font-bold leading-tight ${
              s.status === "cancelled" ? "line-through opacity-60" : ""
            }`}
          >
            {s.title}
          </h1>
        </div>

      </div>

      {s.status !== "cancelled" && (
        <StarButton sessionId={s.id} starred={Boolean(star)} labelled />
      )}

      {s.description && (
        <p className="mt-5 whitespace-pre-wrap leading-relaxed">{s.description}</p>
      )}

      {/* A demo is a pitch; the first thing anyone wants afterwards is the
          thing itself. Only shown when there is somewhere to go - a row
          promising a link that never arrives is worse than no row. */}
      {s.track === "demos" && s.company_url && (
        <TrackedLink
          href={s.company_url}
          event={EVENTS.PRODUCT_LINK_TAPPED}
          className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[var(--color-accent)] p-3.5"
        >
          <span className="text-sm font-medium text-[var(--color-accent)]">
            Visit the product
          </span>
          <span className="shrink-0 text-sm text-[var(--color-accent)]">Open ↗</span>
        </TrackedLink>
      )}

      {speakers.length > 0 && (
        <div className="mt-6 space-y-2">
          {speakers.map((p) => (
            <SpeakerCard key={p.id} speaker={p} sessionId={s.id} />
          ))}
        </div>
      )}

      {/* Someone billed on the session who has no profile yet still gets named
          - better than vanishing from their own talk. */}
      {unlisted.length > 0 && (
        <p className="mt-3 text-[var(--color-muted)]">{unlisted.join(", ")}</p>
      )}

      {/* Slides are only offered once the session has finished — sharing a deck
          while someone is still presenting it undercuts the talk. */}
      {SLIDES_ENABLED && s.slides_url && finished && (
        <SessionSlidesLink url={s.slides_url} />
      )}
      {SLIDES_ENABLED && s.slides_url && !finished && (
        <p className="mt-4 rounded-xl border border-dashed border-[var(--color-line)] p-3.5 text-sm text-[var(--color-muted)]">
          Slides will be available here once the session has finished.
        </p>
      )}

      {s.status !== "cancelled" && (
        <div className="mt-8">
          <RatingModal
            label="Rate this session"
            sessionId={s.id}
            existingStars={myRating?.stars ?? null}
            existingComment={myRating?.comment ?? null}
          />
          <p className="mt-2 text-center text-xs text-[var(--color-muted)]">
            Anonymous. Shared with the speaker as feedback.
          </p>
        </div>
      )}
    </section>
  );
}
