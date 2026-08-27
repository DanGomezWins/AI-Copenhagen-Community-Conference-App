import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildDiff } from "@/lib/scan/diff";
import { ProposedSessionSchema } from "@/lib/scan/schema";
import { z } from "zod";
import type { Session } from "@/lib/program";

export const dynamic = "force-dynamic";

/** Recomputes the diff against live data, so review always reflects reality. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = z.object({ sessions: z.array(ProposedSessionSchema) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad draft." }, { status: 400 });
  }

  const { data: rows } = await supabase
    .from("sessions")
    .select("*")
    .eq("track", "open")
    .order("starts_at", { ascending: true });

  return NextResponse.json({
    diff: buildDiff(parsed.data.sessions, (rows ?? []) as Session[]),
  });
}
