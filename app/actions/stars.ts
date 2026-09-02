"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Adds or removes a session from the signed-in person's My Schedule. */
export async function toggleStar(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const sessionId = String(formData.get("session_id") ?? "");
  const starred = formData.get("starred") === "true";
  if (!sessionId) return;

  if (starred) {
    await supabase
      .from("session_stars")
      .delete()
      .eq("profile_id", user.id)
      .eq("session_id", sessionId);
  } else {
    await supabase
      .from("session_stars")
      .upsert({ profile_id: user.id, session_id: sessionId });
  }

  revalidatePath("/program");
  revalidatePath(`/session/${sessionId}`);
}
