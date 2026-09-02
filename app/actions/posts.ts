"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isTrackKey, TRACKS } from "@/lib/program";
import { sendToAll } from "@/lib/push";
import { POST_MAX } from "@/lib/feed";

export type PostFormState = { error?: string; ok?: boolean };

async function current() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.rpc("is_organiser");
  return { supabase, user, isOrganiser: data === true };
}

function cleanLink(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withScheme);
    // Only ever http(s): a javascript: or data: URL in a link everyone can
    // post is a hole, not a feature.
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export async function createPost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const { supabase, user, isOrganiser } = await current();
  if (!user) return { error: "You are not signed in." };

  const body = String(formData.get("body") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim() || null;

  if (!body && !imageUrl) return { error: "Write something, or add a photo." };
  if (body.length > POST_MAX) {
    return { error: `Keep it under ${POST_MAX} characters.` };
  }

  const rawTrack = String(formData.get("track") ?? "");
  const track = isTrackKey(rawTrack) ? rawTrack : null;

  // Only organisers can raise an alert. If everyone could, the styling that
  // makes an alert mean something would stop meaning anything.
  const wantsAlert = formData.get("kind") === "alert";
  const kind = wantsAlert && isOrganiser ? "alert" : "info";

  const { error } = await supabase.from("posts").insert({
    body: body || "",
    kind,
    track,
    author_id: user.id,
    image_url: imageUrl,
    link_url: cleanLink(String(formData.get("link_url") ?? "")),
  });

  if (error) return { error: error.message };

  // Only organiser posts notify. Two hundred attendees each buzzing every
  // phone would make notifications something people switch off by lunchtime.
  if (isOrganiser) {
    const label = track ? TRACKS.find((t) => t.key === track)?.label : null;
    void sendToAll({
      title: kind === "alert" ? "AIMC-CC — Alert" : "AIMC-CC",
      body: label ? `${label}: ${body}` : body,
      url: "/",
      tag: "organiser-post",
    }).catch(() => {});
  }

  revalidatePath("/");
  return { ok: true };
}

export async function updatePost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const { supabase, user } = await current();
  if (!user) return { error: "You are not signed in." };

  const id = String(formData.get("id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!id) return { error: "Missing post." };
  if (!body) return { error: "Write something first." };
  if (body.length > POST_MAX) {
    return { error: `Keep it under ${POST_MAX} characters.` };
  }

  // RLS decides whether this is allowed; the action does not need to.
  const { error } = await supabase
    .from("posts")
    .update({ body, link_url: cleanLink(String(formData.get("link_url") ?? "")) })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/");
  return { ok: true };
}

export async function deletePost(formData: FormData): Promise<void> {
  const { supabase, user } = await current();
  if (!user) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase.from("posts").delete().eq("id", id);
  revalidatePath("/");
  redirect("/");
}
