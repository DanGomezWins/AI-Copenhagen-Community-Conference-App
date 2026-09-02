"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type RatingState = { error?: string; ok?: boolean };

/**
 * Saves a rating for the app or for one session.
 *
 * The rater's id is stored so a person can revise rather than stack duplicates
 * — but it is never displayed. Feedback reads as anonymous to everyone,
 * organisers included, which is what people were promised when asked for it.
 */
export async function saveRating(
  _prev: RatingState,
  formData: FormData,
): Promise<RatingState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const stars = Number(formData.get("stars"));
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return { error: "Pick a rating from 1 to 5 stars." };
  }

  const sessionId = String(formData.get("session_id") ?? "") || null;
  const subject = sessionId ? "session" : "app";
  const comment = String(formData.get("comment") ?? "").trim().slice(0, 1000) || null;

  const { error } = await supabase.from("ratings").upsert(
    { subject, session_id: sessionId, stars, comment, profile_id: user.id },
    { onConflict: sessionId ? "profile_id,session_id" : "profile_id" },
  );

  if (error) return { error: error.message };

  revalidatePath("/about");
  if (sessionId) revalidatePath(`/session/${sessionId}`);
  return { ok: true };
}
