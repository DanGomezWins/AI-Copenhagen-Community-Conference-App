import { createAdminClient } from "@/lib/supabase/admin";
import { SLIDES_ENABLED } from "@/lib/slides";
import { sendToAll, sendToProfiles } from "@/lib/push";
import { dayBounds, timeAt, TRACKS, type Session } from "@/lib/program";

/** How far ahead of a session to announce it. */
const LEAD_MINUTES = 5;
/**
 * How late an announcement may still fire. Without this, a server that was
 * asleep or redeployed would wake up and dump every missed announcement of the
 * day into the feed at once.
 */
const STALE_MINUTES = 20;
/** Slides are offered for the rest of the day, not just a few minutes after. */
const SLIDES_STALE_MINUTES = 8 * 60;

/**
 * How long after a session ends the prompt is still worth sending.
 *
 * Long enough to survive the scheduler being down for a while, short enough
 * that nobody is asked about a talk two sessions ago.
 */
const NUDGE_STALE_MINUTES = 25;

/** How long after the last session ends to ask about the app itself. */
const DAY_END_DELAY_MINUTES = 30;
/**
 * How late that ask may still fire.
 *
 * Wider than the others, because it happens once and missing it means losing
 * the app's headline rating entirely. Not unbounded, though: a container that
 * slept overnight must not wake up and ask people about yesterday.
 */
const DAY_END_STALE_MINUTES = 4 * 60;

function announcementFor(s: Session): { body: string; push: string } {
  const track = TRACKS.find((t) => t.key === s.track)?.label ?? "";
  const time = timeAt(s.starts_at);

  // A row with no speaker is day structure — a break, lunch, registration.
  if (!s.speaker_name) {
    return { body: `${s.title} — ${time}.`, push: `${s.title} at ${time}` };
  }

  // The track is the room, so naming both would say the same thing twice.
  return {
    body: `Next up at ${time}: ${s.title} — ${s.speaker_name}${track ? ` (${track})` : ""}.`,
    push: `${s.title} — ${s.speaker_name}${track ? `, ${track}` : ""}`,
  };
}

type Tick = {
  posted: number;
  slides: number;
  nudged: number;
  askedAboutApp: number;
  skipped: string | null;
};

/**
 * One tick. Posts "next up" announcements for sessions about to start, and
 * "slides available" for sessions that have finished and have a slides URL.
 *
 * Both claim their row with a conditional update before posting, so a
 * concurrent tick, a restart or a redeploy cannot double-post.
 */
export async function runAnnouncerTick(now: Date = new Date()): Promise<Tick> {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { posted: 0, slides: 0, nudged: 0, askedAboutApp: 0, skipped: "no service role key" };
  }

  const { data: settings } = await admin
    .from("app_settings")
    .select("auto_announce, rating_nudge, app_rating_nudge, app_rating_nudge_sent_at")
    .maybeSingle();

  if (settings?.auto_announce === false) {
    return { posted: 0, slides: 0, nudged: 0, askedAboutApp: 0, skipped: "kill switch is off" };
  }

  let posted = 0;
  let slides = 0;
  let nudged = 0;
  let askedAboutApp = 0;

  // ---------- next up ----------
  const windowEnd = new Date(now.getTime() + LEAD_MINUTES * 60_000);
  const windowStart = new Date(now.getTime() - STALE_MINUTES * 60_000);

  const { data: due } = await admin
    .from("sessions")
    .select("*")
    .is("announced_at", null)
    .eq("status", "scheduled")
    .gte("starts_at", windowStart.toISOString())
    .lte("starts_at", windowEnd.toISOString())
    .order("starts_at", { ascending: true });

  for (const session of (due ?? []) as Session[]) {
    // Claim the row first. If another tick already stamped it, this matches
    // nothing and we skip — cheap optimistic locking that makes double-posting
    // structurally impossible rather than unlikely.
    const { data: claimed } = await admin
      .from("sessions")
      .update({ announced_at: now.toISOString() })
      .eq("id", session.id)
      .is("announced_at", null)
      .select("id")
      .maybeSingle();
    if (!claimed) continue;

    const { body, push } = announcementFor(session);
    const { error } = await admin.from("posts").insert({
      body, kind: "auto", track: session.track, session_id: session.id, author_id: null,
    });

    if (error) {
      // Release the claim so the next tick can retry rather than losing it.
      await admin.from("sessions").update({ announced_at: null }).eq("id", session.id);
      continue;
    }

    posted++;
    await sendToAll({
      title: session.speaker_name ? "Next up" : "AIMC-CC",
      body: push,
      url: `/session/${session.id}`,
      tag: `session-${session.id}`,
    });
  }

  // ---------- slides ----------
  // Wrapped rather than returned out of: an early return here would skip
  // everything below it, which is how the rating prompt silently never ran.
  if (SLIDES_ENABLED) {
    // Only for sessions that have actually finished and that have a URL. A
    // session without slides announces nothing at all, which is the whole point:
    // "slides available" must never be posted for something with no slides.
    const slidesFrom = new Date(now.getTime() - SLIDES_STALE_MINUTES * 60_000);

    const { data: finished } = await admin
      .from("sessions")
      .select("*")
      .is("slides_announced_at", null)
      .not("slides_url", "is", null)
      .eq("status", "scheduled")
      .lte("ends_at", now.toISOString())
      .gte("ends_at", slidesFrom.toISOString())
      .order("ends_at", { ascending: true });

    for (const session of (finished ?? []) as Session[]) {
      const { data: claimed } = await admin
        .from("sessions")
        .update({ slides_announced_at: now.toISOString() })
        .eq("id", session.id)
        .is("slides_announced_at", null)
        .select("id")
        .maybeSingle();
      if (!claimed) continue;

      const who = session.speaker_name ? ` — ${session.speaker_name}` : "";
      const { error } = await admin.from("posts").insert({
        body: `Slides are now available for "${session.title}"${who}. Open the session to download them.`,
        kind: "auto",
        track: session.track,
        session_id: session.id,
        author_id: null,
      });

      if (error) {
        await admin.from("sessions").update({ slides_announced_at: null }).eq("id", session.id);
        continue;
      }

      slides++;
      await sendToAll({
        title: "Slides available",
        body: `${session.title}${who}`,
        url: `/session/${session.id}`,
        tag: `slides-${session.id}`,
      });
    }
  }

  // ---------- ask how it was ----------
  // Only the people who starred it, and only those who have not already said.
  // A star is the one signal we have that somebody chose to be in the room;
  // asking everyone about every session is how a useful channel gets muted.
  if (settings?.rating_nudge !== false) {
    const nudgeFrom = new Date(now.getTime() - NUDGE_STALE_MINUTES * 60_000);

    const { data: justFinished } = await admin
      .from("sessions")
      .select("*")
      .is("rating_nudge_sent_at", null)
      .not("speaker_name", "is", null) // breaks and lunch are not rated
      .eq("status", "scheduled")
      .lte("ends_at", now.toISOString())
      .gte("ends_at", nudgeFrom.toISOString());

    for (const session of (justFinished ?? []) as Session[]) {
      // Claim first, so two overlapping ticks cannot both ask.
      const { data: claimed } = await admin
        .from("sessions")
        .update({ rating_nudge_sent_at: now.toISOString() })
        .eq("id", session.id)
        .is("rating_nudge_sent_at", null)
        .select("id")
        .maybeSingle();
      if (!claimed) continue;

      const [{ data: stars }, { data: rated }] = await Promise.all([
        admin.from("session_stars").select("profile_id").eq("session_id", session.id),
        admin.from("ratings").select("profile_id").eq("session_id", session.id),
      ]);

      const alreadyRated = new Set((rated ?? []).map((r) => r.profile_id));
      const ask = (stars ?? [])
        .map((s) => s.profile_id)
        .filter((id) => !alreadyRated.has(id));

      if (!ask.length) continue;

      const result = await sendToProfiles(ask, {
        title: "How was it?",
        body: `Rate ${session.title} while it is fresh.`,
        url: `/session/${session.id}`,
        tag: `rate-${session.id}`,
      });
      if (result.sent > 0) nudged++;
    }
  }

  // ---------- how was the app? ----------
  // Once, after the last session of the day, to the people who have not
  // already said. This is the only prompt that produces the app's own rating,
  // so it is worth one buzz - but exactly one, at the point where somebody has
  // seen enough of the app to have an opinion about it.
  //
  // Deliberately not mid-day: notification permission is the scarcest thing
  // the app has, and spending it on a metric rather than on something useful
  // to the person is how people turn notifications off - which would cost the
  // schedule alerts that genuinely help them.
  if (settings?.app_rating_nudge !== false && !settings?.app_rating_nudge_sent_at) {
    // Derived from the programme rather than hard-coded, so a day that runs
    // long moves the ask with it.
    // Bounded to today in Copenhagen. Unbounded, this would always find the
    // furthest-future session - the real programme - so the ask could never
    // fire while testing, and on the day would key off the wrong session if
    // anything were ever scheduled later.
    const day = dayBounds(now);
    const { data: last } = await admin
      .from("sessions")
      .select("ends_at")
      .eq("status", "scheduled")
      .gte("ends_at", day.from)
      .lte("ends_at", day.to)
      .order("ends_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const askAt = last?.ends_at
      ? new Date(new Date(last.ends_at).getTime() + DAY_END_DELAY_MINUTES * 60_000)
      : null;

    if (
      askAt &&
      now >= askAt &&
      now < new Date(askAt.getTime() + DAY_END_STALE_MINUTES * 60_000)
    ) {
      // Claim before sending, so two overlapping ticks cannot both ask. The
      // claim lives on app_settings because this fires once for the whole
      // conference, not once per row.
      const { data: claimed } = await admin
        .from("app_settings")
        .update({ app_rating_nudge_sent_at: now.toISOString() })
        .eq("id", true)
        .is("app_rating_nudge_sent_at", null)
        .select("id")
        .maybeSingle();

      if (claimed) {
        const [{ data: subs }, { data: rated }] = await Promise.all([
          admin.from("push_subscriptions").select("profile_id"),
          admin.from("ratings").select("profile_id").eq("subject", "app"),
        ]);

        const alreadyRated = new Set((rated ?? []).map((r) => r.profile_id));
        // One person can have several subscriptions - a phone and a laptop -
        // and asking them twice for one opinion is worse than not asking.
        const ask = [
          ...new Set(
            (subs ?? [])
              .map((s) => s.profile_id as string | null)
              .filter((id): id is string => Boolean(id)),
          ),
        ].filter((id) => !alreadyRated.has(id));

        if (ask.length) {
          const result = await sendToProfiles(ask, {
            title: "One last thing",
            body: "We'd love your feedback on the app — two taps.",
            url: "/about",
            tag: "rate-app",
          });

          // People, not devices. result.sent counts subscriptions, and one
          // person routinely has several - a phone, a laptop, and a few dead
          // ones from reinstalls - so reporting it would read as far more
          // reach than the ask actually has.
          askedAboutApp = result.sent > 0 ? ask.length : 0;

          // Release the claim if nothing actually went out, so the next tick
          // can retry inside the window. Push failures are silent by design,
          // and a silent failure here loses the headline number for good.
          if (result.sent === 0) {
            await admin
              .from("app_settings")
              .update({ app_rating_nudge_sent_at: null })
              .eq("id", true);
          }
        }
        // Nobody left to ask is a finished job, not a failure - the claim
        // stays stamped so it is not reconsidered every minute.
      }
    }
  }

  return { posted, slides, nudged, askedAboutApp, skipped: null };
}
