"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type TopicState = { error?: string; ok?: boolean };

const TITLE_MAX = 90;
const DETAIL_MAX = 400;
const NAME_MAX = 60;

function read(formData: FormData) {
  const kind = String(formData.get("kind") ?? "");
  const anon = formData.get("anon") === "on";
  const slot = String(formData.get("slot") ?? "").trim();
  return {
    id: String(formData.get("id") ?? "") || null,
    title: String(formData.get("title") ?? "").trim().slice(0, TITLE_MAX),
    detail: String(formData.get("detail") ?? "").trim().slice(0, DETAIL_MAX) || null,
    kind: kind === "tell" ? "tell" : "ask",
    // "No preference" is the absence of a preference, not a value to store.
    slot: slot && slot !== "No preference" ? slot : null,
    proposer_name: anon
      ? null
      : String(formData.get("proposer_name") ?? "").trim().slice(0, NAME_MAX) || null,
  };
}

/**
 * Creates a topic, or updates one you already proposed.
 *
 * created_by is always recorded, even for an anonymous topic, so the proposer
 * can come back and edit it. RLS is what actually enforces that - the check
 * here only decides which message you see.
 */
export async function saveTopic(
  _prev: TopicState,
  formData: FormData,
): Promise<TopicState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const f = read(formData);
  if (!f.title) return { error: "Give your topic a title." };

  const row = {
    title: f.title,
    detail: f.detail,
    kind: f.kind,
    slot: f.slot,
    proposer_name: f.proposer_name,
  };

  if (f.id) {
    const { error } = await supabase.from("open_topics").update(row).eq("id", f.id);
    if (error) {
      console.error("saveTopic update failed:", error.message);
      return { error: "That didn't save. It may not be your topic to edit." };
    }
  } else {
    const { data: created, error } = await supabase
      .from("open_topics")
      .insert({ ...row, created_by: user.id })
      .select("id")
      .single();
    if (error || !created) {
      console.error("saveTopic insert failed:", error?.message);
      return { error: "That didn't save. Try again in a moment." };
    }
    // Proposing is a vote for your own topic - you would not suggest something
    // you would not attend, and starting at zero reads as though nobody cares.
    await supabase
      .from("open_topic_votes")
      .insert({ topic_id: created.id, profile_id: user.id });
  }

  revalidatePath("/program");
  return { ok: true };
}

export async function deleteTopic(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase.from("open_topics").delete().eq("id", id);
  revalidatePath("/program");
}

/**
 * Casts or withdraws your vote.
 *
 * The primary key on (topic_id, profile_id) is the real guard: a duplicate
 * insert is rejected by the database, so a double tap or two open tabs cannot
 * produce two votes.
 */
export async function toggleVote(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const topicId = String(formData.get("topic_id") ?? "");
  if (!topicId) return;

  const voted = formData.get("voted") === "true";

  if (voted) {
    await supabase
      .from("open_topic_votes")
      .delete()
      .eq("topic_id", topicId)
      .eq("profile_id", user.id);
  } else {
    await supabase
      .from("open_topic_votes")
      .insert({ topic_id: topicId, profile_id: user.id });
  }

  revalidatePath("/program");
}
