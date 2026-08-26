import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runAnnouncerTick } from "@/lib/announcer";

export const dynamic = "force-dynamic";

/** Manual tick, for testing the announcer without waiting for the clock. */
export async function POST() {
  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("is_organiser");
  if (allowed !== true) {
    return NextResponse.json({ error: "Organisers only." }, { status: 403 });
  }

  const result = await runAnnouncerTick();
  return NextResponse.json(result);
}
