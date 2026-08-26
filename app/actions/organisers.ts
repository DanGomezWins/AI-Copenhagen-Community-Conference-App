"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type OrganiserFormState = { error?: string; ok?: string };

export async function addOrganiser(
  _prev: OrganiserFormState,
  formData: FormData,
): Promise<OrganiserFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!email) return { error: "Enter an email address." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "That doesn't look like an email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("organisers").insert({ email, note });

  if (error) {
    if (error.code === "23505") return { error: `${email} is already an organiser.` };
    return { error: error.message };
  }

  revalidatePath("/admin/organisers");
  return { ok: `${email} can now post updates.` };
}

export async function removeOrganiser(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  if (!email) return;

  const supabase = await createClient();
  await supabase.from("organisers").delete().eq("email", email);
  revalidatePath("/admin/organisers");
}
