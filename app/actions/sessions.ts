"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isTrackKey, timeToIso, timeAt, describeChange, roomForTrack, type Session } from "@/lib/program";
import { titleCaseName } from "@/lib/names";

/**
 * Slide links are http(s) only. Anything else in a field that later becomes a
 * download button for two hundred people is not worth the risk.
 */
function cleanPdfUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  try {
    const u = new URL(/^https?:[/][/]/i.test(v) ? v : `https://${v}`);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export type SessionFormState = { error?: string; warning?: string };

async function organiserClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.rpc("is_organiser");
  return { supabase, user, allowed: data === true };
}

function readForm(formData: FormData) {
  const track = String(formData.get("track") ?? "");
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "");
  return {
    track: isTrackKey(track) ? track : null,
    title: String(formData.get("title") ?? "").trim(),
    speaker_name: titleCaseName(String(formData.get("speaker_name") ?? "")) || null,
    description: String(formData.get("description") ?? "").trim() || null,
    slides_url: cleanPdfUrl(String(formData.get("slides_url") ?? "")),
    starts_at: startTime ? timeToIso(startTime) : null,
    ends_at: endTime ? timeToIso(endTime) : null,
    announce: formData.get("announce") === "on",
  };
}

export async function saveSession(
  _prev: SessionFormState,
  formData: FormData,
): Promise<SessionFormState> {
  const { supabase, user, allowed } = await organiserClient();
  if (!user || !allowed) return { error: "Only organisers can edit the schedule." };

  const id = String(formData.get("id") ?? "") || null;
  const f = readForm(formData);

  if (!f.track) return { error: "Pick a track." };
  if (!f.title) return { error: "Give the session a title." };
  if (!f.starts_at) return { error: "Set a start time." };
  if (f.ends_at && f.ends_at <= f.starts_at) {
    return { error: "The end time has to be after the start time." };
  }

  let before: Session | null = null;
  if (id) {
    const { data } = await supabase.from("sessions").select("*").eq("id", id).maybeSingle();
    before = data as Session | null;
  }

  const row = {
    track: f.track,
    title: f.title,
    speaker_name: f.speaker_name,
    description: f.description,
    slides_url: f.slides_url,
    // Always derived: the track is the room.
    room: roomForTrack(f.track),
    starts_at: f.starts_at,
    ends_at: f.ends_at,
  };

  // Warn on a room clash. Deliberately a warning, not a block: on the day an
  // organiser may genuinely need two things in one room briefly, and refusing
  // the save would leave them stuck. They just need to know it happened.
  const clash = await findClash(supabase, row.room, f.starts_at, f.ends_at, id);

  const { data: saved, error } = id
    ? await supabase.from("sessions").update(row).eq("id", id).select("*").maybeSingle()
    : await supabase.from("sessions").insert(row).select("*").maybeSingle();

  if (error) return { error: error.message };

  // Announce only real, attendee-visible changes, and only when asked.
  // A typo fix should not buzz 200 phones.
  if (f.announce && saved) {
    const after = saved as Session;
    // A brand new session has nothing to diff against, but adding one to the
    // programme is exactly the kind of thing attendees need to hear about.
    const notice = before
      ? describeChange(before, after)
      : `Added to the programme: ${after.title}${
          after.speaker_name ? ` — ${after.speaker_name}` : ""
        } (${timeAt(after.starts_at)}${after.room ? `, ${after.room}` : ""}).`;

    if (notice) {
      await supabase.from("posts").insert({
        body: notice,
        kind: "schedule_change",
        track: f.track,
        author_id: user.id,
        session_id: after.id,
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/program");
  revalidatePath("/admin/schedule");

  if (clash) {
    return {
      warning:
        `Your change was saved. ${clash.room} now has both this session and ` +
        `"${clash.title}" (${timeAt(clash.starts_at)}` +
        `${clash.ends_at ? `–${timeAt(clash.ends_at)}` : ""}) overlapping. ` +
        `Both are showing to attendees — move or cancel one if that is wrong.`,
    };
  }

  redirect("/admin/schedule");
}

/** Another scheduled session sharing a room and overlapping in time. */
async function findClash(
  supabase: Awaited<ReturnType<typeof createClient>>,
  room: string | null,
  startsAt: string,
  endsAt: string | null,
  excludeId: string | null,
): Promise<Session | null> {
  if (!room) return null;

  // Compare instants, never strings. timeToIso() builds "+02:00" timestamps
  // while Postgres returns "+00:00", so comparing them as text put 12:40Z
  // before 14:15+02:00 even though it is forty minutes later — which silently
  // missed every clash.
  const ms = (iso: string) => new Date(iso).getTime();
  const DEFAULT_LENGTH = 25 * 60_000;

  const from = ms(startsAt);
  const to = endsAt ? ms(endsAt) : from + DEFAULT_LENGTH;

  const { data } = await supabase
    .from("sessions")
    .select("*")
    .eq("room", room)
    .eq("status", "scheduled");

  for (const other of (data ?? []) as Session[]) {
    if (excludeId && other.id === excludeId) continue;
    if (!other.speaker_name) continue; // breaks and lunch legitimately overlap

    const otherFrom = ms(other.starts_at);
    const otherTo = other.ends_at ? ms(other.ends_at) : otherFrom + DEFAULT_LENGTH;

    // Half-open intervals: a session ending exactly when another starts is
    // back-to-back, not a clash.
    if (otherFrom < to && otherTo > from) return other;
  }
  return null;
}


export async function setCancelled(formData: FormData): Promise<void> {
  const { supabase, user, allowed } = await organiserClient();
  if (!user || !allowed) return;

  const id = String(formData.get("id") ?? "");
  const cancel = formData.get("cancel") === "true";
  if (!id) return;

  const { data: before } = await supabase.from("sessions").select("*").eq("id", id).maybeSingle();
  const { data: after } = await supabase
    .from("sessions")
    .update({ status: cancel ? "cancelled" : "scheduled" })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (cancel && before && after) {
    const notice = describeChange(before as Session, after as Session);
    if (notice) {
      await supabase.from("posts").insert({
        body: notice,
        kind: "schedule_change",
        track: (after as Session).track,
        author_id: user.id,
        session_id: id,
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/program");
  revalidatePath("/admin/schedule");
}

export async function deleteSession(formData: FormData): Promise<void> {
  const { supabase, user, allowed } = await organiserClient();
  if (!user || !allowed) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase.from("sessions").delete().eq("id", id);
  revalidatePath("/program");
  revalidatePath("/admin/schedule");
  redirect("/admin/schedule");
}
