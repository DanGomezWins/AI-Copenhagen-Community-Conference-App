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

  // One conflict target for both cases. An app rating has session_id = null,
  // and the index behind this is NULLS NOT DISTINCT so that still resolves to
  // a single row per person. See migration 0012 — the previous version named
  // partial indexes here, which Postgres cannot infer from, so every save
  // failed.
  const { error } = await supabase.from("ratings").upsert(
    { subject, session_id: sessionId, stars, comment, profile_id: user.id },
    { onConflict: "profile_id,session_id" },
  );

  if (error) {
    // The raw Postgres text ("no unique or exclusion constraint matching the
    // ON CONFLICT specification") means nothing to someone rating a talk.
    console.error("saveRating failed:", error.message);
    return { error: "That didn't save. Try again in a moment." };
  }

  revalidatePath("/about");
  if (sessionId) revalidatePath(`/session/${sessionId}`);
  return { ok: true };
}
