"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setAutoAnnounce(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("is_organiser");
  if (allowed !== true) return;

  const on = formData.get("on") === "true";
  await supabase.from("app_settings").update({ auto_announce: on }).eq("id", true);

  revalidatePath("/admin");
}

/**
 * The rating prompt has its own switch, separate from the announcer.
 *
 * On the day an organiser may want the schedule notices while deciding the
 * rating prompts are one buzz too many. Sharing a kill switch would mean
 * losing both, and losing the schedule notices is the more costly half.
 */
export async function setRatingNudge(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("is_organiser");
  if (allowed !== true) return;

  const on = formData.get("on") === "true";
  await supabase.from("app_settings").update({ rating_nudge: on }).eq("id", true);

  revalidatePath("/admin");
}
