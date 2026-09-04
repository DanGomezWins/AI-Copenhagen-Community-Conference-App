import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SCAN_ENABLED } from "@/lib/scan/enabled";
import { ScanResultSchema } from "@/lib/scan/schema";
import { buildDiff, summarise } from "@/lib/scan/diff";
import { timeToIso, roomForTrack, type Session } from "@/lib/program";
import { titleCaseName } from "@/lib/names";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Retired with Open Sessions - see lib/scan/enabled.ts.
  if (!SCAN_ENABLED) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const { id } = await request.json();
  const { data: draft } = await supabase
    .from("schedule_drafts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!draft) {
    return NextResponse.json({ error: "That draft no longer exists." }, { status: 404 });
  }
  if (draft.status === "published") {
    return NextResponse.json({ error: "Already published." }, { status: 409 });
  }

  const parsed = ScanResultSchema.safeParse(draft.proposed);
  if (!parsed.success) {
    return NextResponse.json({ error: "That draft is corrupt — rescan." }, { status: 400 });
  }

  const { data: rows } = await supabase
    .from("sessions")
    .select("*")
    .eq("track", "open")
    .order("starts_at", { ascending: true });
  const existing = (rows ?? []) as Session[];

  const diff = buildDiff(parsed.data.sessions, existing);
  const stats = summarise(diff);

  for (const row of diff) {
    if (row.kind === "new" && row.proposed) {
      const p = row.proposed;
      await supabase.from("sessions").insert({
        track: "open",
        title: p.title,
        speaker_name: p.speaker_name ? titleCaseName(p.speaker_name) : null,
        starts_at: timeToIso(p.start_time),
        ends_at: p.end_time ? timeToIso(p.end_time) : null,
        room: roomForTrack("open"),
      });
    } else if (row.kind === "changed" && row.proposed && row.existing) {
      const p = row.proposed;
      await supabase
        .from("sessions")
        .update({
          title: p.title,
          speaker_name: p.speaker_name ? titleCaseName(p.speaker_name) : null,
          starts_at: timeToIso(p.start_time),
          ends_at: p.end_time ? timeToIso(p.end_time) : row.existing.ends_at,
          room: roomForTrack("open"),
        })
        .eq("id", row.existing.id);
    } else if (row.kind === "removed" && row.existing) {
      // Cancel rather than delete: the slot stays visible so attendees who saw
      // it earlier understand it is gone, instead of it silently vanishing.
      await supabase
        .from("sessions")
        .update({ status: "cancelled" })
        .eq("id", row.existing.id);
    }
  }

  await supabase
    .from("schedule_drafts")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id);

  const bits = [
    stats.added ? `${stats.added} added` : null,
    stats.changed ? `${stats.changed} changed` : null,
    stats.removed ? `${stats.removed} removed` : null,
  ].filter(Boolean);

  if (bits.length) {
    await supabase.from("posts").insert({
      body: `Open Sessions schedule updated — ${bits.join(", ")}. Check the Program tab.`,
      kind: "schedule_change",
      track: "open",
      author_id: user.id,
    });
  }

  revalidatePath("/");
  revalidatePath("/program");
  revalidatePath("/admin/schedule");

  return NextResponse.json({ ok: true, stats });
}
