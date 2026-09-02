import { createAdminClient } from "@/lib/supabase/admin";
import { sendToAll } from "@/lib/push";
import { timeAt, TRACKS, type Session } from "@/lib/program";

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

type Tick = { posted: number; slides: number; skipped: string | null };

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
    return { posted: 0, slides: 0, skipped: "no service role key" };
  }

  const { data: settings } = await admin
    .from("app_settings")
    .select("auto_announce")
    .maybeSingle();

  if (settings?.auto_announce === false) {
    return { posted: 0, slides: 0, skipped: "kill switch is off" };
  }

  let posted = 0;
  let slides = 0;

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

  return { posted, slides, skipped: null };
}
