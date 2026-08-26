import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { refineDraft, type RefineTurn } from "@/lib/scan/claude";
import { ScanResultSchema } from "@/lib/scan/schema";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: allowed } = await supabase.rpc("is_organiser");
  if (!user || allowed !== true) {
    return NextResponse.json({ error: "Organisers only." }, { status: 403 });
  }

  const { id, instruction } = await request.json();
  if (!id || typeof instruction !== "string" || !instruction.trim()) {
    return NextResponse.json({ error: "Say what needs changing." }, { status: 400 });
  }

  const { data: draft } = await supabase
    .from("schedule_drafts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!draft) {
    return NextResponse.json({ error: "That draft no longer exists." }, { status: 404 });
  }

  const parsed = ScanResultSchema.safeParse(draft.proposed);
  if (!parsed.success) {
    return NextResponse.json({ error: "That draft is corrupt — rescan." }, { status: 400 });
  }

  const history = (draft.conversation ?? []) as RefineTurn[];

  try {
    const revised = await refineDraft(parsed.data, instruction.trim(), history);

    await supabase
      .from("schedule_drafts")
      .update({
        proposed: revised,
        conversation: [
          ...history,
          { role: "user", content: instruction.trim() },
          { role: "assistant", content: "Applied." },
        ],
      })
      .eq("id", id);

    return NextResponse.json({ result: revised });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not apply that." },
      { status: 500 },
    );
  }
}
