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
