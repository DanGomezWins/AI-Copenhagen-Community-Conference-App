"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ProfileFormState = { error?: string; ok?: boolean };

/**
 * Looks the signed-in user up in the attendee allowlist to prefill their
 * profile. Uses the admin client because attendee_allowlist is deliberately
 * unreadable by ordinary users — it holds data for people who have not opted
 * into the directory.
 */
export async function getPrefill() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("attendee_allowlist")
      .select("first_name, last_name, company, role, is_speaker")
      .eq("email", user.email.toLowerCase())
      .maybeSingle();
    return data;
  } catch {
    return null; // No service-role key configured, or no match — not fatal.
  }
}

function clean(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

export async function saveProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const first = clean(formData.get("first_name"));
  const last = clean(formData.get("last_name"));
  if (!first || !last) return { error: "First and last name are required." };

  let linkedin = clean(formData.get("linkedin_url"));
  if (linkedin && !/^https?:\/\//i.test(linkedin)) linkedin = `https://${linkedin}`;

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    first_name: first,
    last_name: last,
    is_speaker: formData.get("is_speaker") === "speaker",
    company: clean(formData.get("company")),
    role: clean(formData.get("role")),
    linkedin_url: linkedin,
    public_email: clean(formData.get("public_email")),
  });

  if (error) return { error: error.message };

  revalidatePath("/me");
  revalidatePath("/people");
  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
