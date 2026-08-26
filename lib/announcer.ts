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

function announcementFor(s: Session): { body: string; push: string } {
  const track = TRACKS.find((t) => t.key === s.track)?.label ?? "";
  const time = timeAt(s.starts_at);

  // A row with no speaker is day structure — a break, lunch, registration.
  if (!s.speaker_name) {
    return {
      body: `${s.title} — ${time}.`,
      push: `${s.title} at ${time}`,
    };
  }

  const where = [s.room, track].filter(Boolean).join(" · ");
  return {
    body: `Next up at ${time}: ${s.title} — ${s.speaker_name}${where ? ` (${where})` : ""}.`,
    push: `${s.title} — ${s.speaker_name}${s.room ? `, ${s.room}` : ""}`,
  };
}

/**
 * One tick. Posts announcements for sessions starting inside the lead window
 * that haven't been announced yet, then stamps them so a restart, redeploy or
 * overlapping tick cannot double-post.
 */
export async function runAnnouncerTick(now: Date = new Date()): Promise<{
  posted: number;
  skipped: string | null;
}> {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { posted: 0, skipped: "no service role key" };
  }

  const { data: settings } = await admin
    .from("app_settings")
    .select("auto_announce")
    .maybeSingle();

  if (settings?.auto_announce === false) {
    return { posted: 0, skipped: "kill switch is off" };
  }

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

  if (!due?.length) return { posted: 0, skipped: null };

  let posted = 0;
  for (const session of due as Session[]) {
    // Claim the row first. If another tick or another instance already stamped
    // it, this matches nothing and we skip — cheap optimistic locking that
    // makes double-posting structurally impossible rather than unlikely.
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
      body,
      kind: "auto",
      track: session.track,
      session_id: session.id,
      author_id: null,
    });

    if (error) {
      // Release the claim so the next tick can retry rather than losing it.
      await admin.from("sessions").update({ announced_at: null }).eq("id", session.id);
      continue;
    }

    posted++;
    await sendToAll({
      title: session.speaker_name ? "Next up" : "AIC Info",
      body: push,
      url: `/program?track=${session.track}`,
      tag: `session-${session.id}`,
    });
  }

  return { posted, skipped: null };
}
