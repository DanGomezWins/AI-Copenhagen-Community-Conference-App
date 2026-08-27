"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isTrackKey, TRACKS } from "@/lib/program";
import { sendToAll } from "@/lib/push";

export type PostFormState = { error?: string; ok?: boolean };

async function requireOrganiser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, allowed: false };

  const { data } = await supabase.rpc("is_organiser");
  return { supabase, user, allowed: data === true };
}

export async function createPost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const { supabase, user, allowed } = await requireOrganiser();
  if (!user) return { error: "You are not signed in." };
  if (!allowed) return { error: "Only organisers can post updates." };

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write something first." };
  if (body.length > 1000) return { error: "Keep it under 1000 characters." };

  const rawTrack = String(formData.get("track") ?? "");
  const rawKind = String(formData.get("kind") ?? "info");

  const { error } = await supabase.from("posts").insert({
    body,
    kind: rawKind === "alert" ? "alert" : "info",
    track: isTrackKey(rawTrack) ? rawTrack : null,
    author_id: user.id,
  });

  if (error) return { error: error.message };

  // Push is an accelerant, never a gate: a failure here must not fail the post,
  // because the feed is the source of truth.
  const track = isTrackKey(rawTrack) ? rawTrack : null;
  const label = track ? TRACKS.find((t) => t.key === track)?.label : null;
  void sendToAll({
    title: rawKind === "alert" ? "AIC Info — Alert" : "AIC Info",
    body: label ? `${label}: ${body}` : body,
    url: "/",
    tag: "organiser-post",
  }).catch(() => {});

  revalidatePath("/");
  revalidatePath("/admin/post");
  return { ok: true };
}

export async function updatePost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const { supabase, user, allowed } = await requireOrganiser();
  if (!user || !allowed) return { error: "Only organisers can edit updates." };

  const id = String(formData.get("id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!id) return { error: "Missing post." };
  if (!body) return { error: "Write something first." };

  const { error } = await supabase.from("posts").update({ body }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/");
  return { ok: true };
}

export async function deletePost(formData: FormData): Promise<void> {
  const { supabase, user, allowed } = await requireOrganiser();
  if (!user || !allowed) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase.from("posts").delete().eq("id", id);
  revalidatePath("/");
  redirect("/");
}
