import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendToAll } from "@/lib/push";

export const dynamic = "force-dynamic";

/**
 * Receives the Open Space agenda from the platform that runs the voting.
 *
 * Full replace, not a merge: the sender owns the agenda, and "push the whole
 * thing again" is a correction anyone can make under time pressure, where
 * working out which rows to patch is not.
 *
 * Writes with the service role, so the table needs no write policy and no
 * attendee session can reach it.
 */

const Session = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullish(),
  /** Free text. May be absent: topics can be proposed anonymously. */
  facilitator: z.string().trim().max(120).nullish(),
  /** Shown exactly as sent, e.g. "13:20 - 13:45". */
  slot: z.string().trim().max(60).nullish(),
  kind: z.enum(["ask", "tell"]).nullish(),
});

const Payload = z.object({
  sessions: z.array(Session).max(50),
  /**
   * Off unless asked for. The endpoint is live, so it is also the test
   * endpoint - and a default of true would notify two hundred phones on every
   * trial push. Set it on the final one.
   */
  announce: z.boolean().default(false),
});

function authorised(request: NextRequest): boolean {
  const expected = process.env.OPEN_SESSIONS_TOKEN;
  if (!expected) return false;

  const header = request.headers.get("authorization") ?? "";
  const supplied = header.replace(/^Bearer\s+/i, "");
  if (!supplied) return false;

  // Length differences leak through timingSafeEqual, which throws on a
  // mismatch, so compare fixed-size buffers.
  const a = Buffer.from(supplied.padEnd(128).slice(0, 128));
  const b = Buffer.from(expected.padEnd(128).slice(0, 128));
  return timingSafeEqual(a, b) && supplied.length === expected.length;
}

export async function POST(request: NextRequest) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const parsed = Payload.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", details: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  const { sessions, announce } = parsed.data;
  const admin = createAdminClient();

  // Replace in one go. Deleting first means an empty array clears the agenda,
  // which is the only way to undo a mistaken push.
  const { error: clearError } = await admin
    .from("open_agenda")
    .delete()
    .not("id", "is", null);
  if (clearError) {
    return NextResponse.json({ error: clearError.message }, { status: 500 });
  }

  if (sessions.length > 0) {
    const rows = sessions.map((s, i) => ({
      position: i,
      title: s.title,
      description: s.description ?? null,
      facilitator: s.facilitator ?? null,
      slot: s.slot ?? null,
      kind: s.kind ?? null,
    }));
    const { error } = await admin.from("open_agenda").insert(rows);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (announce && sessions.length > 0) {
    await admin.from("posts").insert({
      body: `The Open Space schedule is set — ${sessions.length} sessions. Open the Program, then Open sessions, to see what is on.`,
      kind: "auto",
      track: "open",
      author_id: null,
    });
    await sendToAll({
      title: "Open Space schedule",
      body: `${sessions.length} sessions are now on the programme.`,
      url: "/program?track=open",
      tag: "open-agenda",
    });
  }

  revalidatePath("/program");
  revalidatePath("/");

  return NextResponse.json({ ok: true, replaced: sessions.length, announced: announce });
}
