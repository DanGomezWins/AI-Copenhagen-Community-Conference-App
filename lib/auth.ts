import { createClient } from "@/lib/supabase/server";

/** True when the signed-in user's email is on the organisers allowlist. */
export async function isOrganiser(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_organiser");
  return data === true;
}
