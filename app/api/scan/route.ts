import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractFromPhoto } from "@/lib/scan/claude";
import type { Session } from "@/lib/program";

export const dynamic = "force-dynamic";
// Vision on a photo with adaptive thinking can take a while; don't cut it off.
export const maxDuration = 120;

const ALLOWED = ["image/jpeg", "image/png", "image/webp"] as const;
type Allowed = (typeof ALLOWED)[number];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: allowed } = await supabase.rpc("is_organiser");

  if (!user || allowed !== true) {
    return NextResponse.json({ error: "Organisers only." }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("photo");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No photo received." }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type as Allowed)) {
    return NextResponse.json(
      { error: "Use a JPEG, PNG or WebP photo." },
      { status: 400 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  // Keep the original in the private scans bucket. If Claude misreads something
  // and nobody notices until later, the evidence is still there.
  const path = `${user.id}/${Date.now()}.${file.type.split("/")[1]}`;
  const admin = createAdminClient();
  const { error: upErr } = await admin.storage
    .from("scans")
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (upErr) {
    return NextResponse.json({ error: `Upload failed: ${upErr.message}` }, { status: 500 });
  }

  const { data: draft, error: draftErr } = await supabase
    .from("schedule_drafts")
    .insert({ photo_url: path, status: "processing", track: "open" })
    .select("id")
    .single();
  if (draftErr) {
    return NextResponse.json({ error: draftErr.message }, { status: 500 });
  }

  try {
    const { data: rows } = await supabase
      .from("sessions")
      .select("*")
      .eq("track", "open")
      .order("starts_at", { ascending: true });

    const result = await extractFromPhoto(
      bytes.toString("base64"),
      file.type as Allowed,
      (rows ?? []) as Session[],
    );

    await supabase
      .from("schedule_drafts")
      .update({ status: "review", proposed: result })
      .eq("id", draft.id);

    return NextResponse.json({ id: draft.id, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extraction failed.";
    await supabase
      .from("schedule_drafts")
      .update({ status: "discarded", error: message })
      .eq("id", draft.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
