"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runAnnouncerTick } from "@/lib/announcer";
import { sendToAll } from "@/lib/push";
import { TEST_MARK } from "@/lib/test-mark";
import { timeAt, roomForTrack } from "@/lib/program";



async function guard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.rpc("is_organiser");
  return { supabase, user, ok: data === true && Boolean(user) };
}

/**
 * Creates a session a few minutes from now, dated TODAY.
 *
 * The real programme is all on 10 September, so nothing in it can ever fall
 * inside the announcer's window until the day itself. Without this the
 * announcer is untestable before the event, which is the worst possible time
 * to discover it doesn't work.
 */
export async function createTestSession(formData: FormData): Promise<void> {
  const { ok } = await guard();
  if (!ok) return;

  const minutes = Number(formData.get("minutes") ?? 3);
  const starts = new Date(Date.now() + minutes * 60_000);
  const ends = new Date(starts.getTime() + 25 * 60_000);

  const admin = createAdminClient();
  await admin.from("sessions").insert({
    track: "open",
    // timeAt() formats in Copenhagen. getHours() would use the server's clock,
    // which on Railway is UTC — that is why the label read two hours behind.
    title: `Announcer test — ${timeAt(starts.toISOString())}`,
    speaker_name: "Test Speaker",
    starts_at: starts.toISOString(),
    ends_at: ends.toISOString(),
    room: roomForTrack("open"),
    notes: TEST_MARK,
  });

  revalidatePath("/admin/test");
  revalidatePath("/program");
}

export async function runAnnouncerNow(): Promise<void> {
  const { ok } = await guard();
  if (!ok) return;
  await runAnnouncerTick();
  revalidatePath("/");
  revalidatePath("/admin/test");
}

/**
 * Sends a test notification and reports what the push service actually said.
 *
 * sendToAll deliberately swallows failures — a push that doesn't land must
 * never break the action that triggered it. That is right in production and
 * useless while testing: the button appeared to do nothing whether it had sent
 * to five devices or failed on all of them. The counts come back in the URL so
 * there is something to read.
 */
export async function sendTestPush(): Promise<void> {
  const { ok } = await guard();
  if (!ok) redirect("/admin/test?push=notallowed");

  const result = await sendToAll({
    title: "AIC Info — test",
    body: "If you can see this, notifications are working.",
    url: "/",
    tag: "test-push",
  });

  redirect(
    `/admin/test?push=${result.sent}-${result.failed}-${result.removed}`,
  );
}

export async function clearTestData(): Promise<void> {
  const { ok } = await guard();
  if (!ok) return;

  const admin = createAdminClient();
  const { data: sessions } = await admin
    .from("sessions")
    .select("id")
    .eq("notes", TEST_MARK);

  const ids = (sessions ?? []).map((s) => s.id);
  if (ids.length) {
    await admin.from("posts").delete().in("session_id", ids);
    await admin.from("sessions").delete().in("id", ids);
  }

  revalidatePath("/");
  revalidatePath("/program");
  revalidatePath("/admin/test");
}
