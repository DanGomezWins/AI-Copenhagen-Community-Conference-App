import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { USER_ID_HEADER, USER_EMAIL_HEADER } from "@/lib/auth-headers";

export type CurrentUser = { id: string; email: string | null };

/**
 * The signed-in user, read from the request instead of re-verified.
 *
 * The proxy has already called getUser() — a network round trip to Supabase
 * Auth — and turns away anything without a session, so code rendering beneath
 * it is signed in by definition. Asking again buys nothing and costs another
 * round trip: one view of the Program was making four of them (proxy,
 * AppHeader, AnalyticsProvider, the page), and on a server far from the auth
 * server that was most of the wait before the tab changed.
 *
 * Identity only. Authorisation is still RLS, which sees the user's own JWT on
 * every query no matter what this returns.
 */
export async function currentUser(): Promise<CurrentUser | null> {
  const h = await headers();
  const id = h.get(USER_ID_HEADER);
  if (!id) return null;
  return { id, email: h.get(USER_EMAIL_HEADER) };
}

/** True when the signed-in user's email is on the organisers allowlist. */
export async function isOrganiser(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_organiser");
  return data === true;
}
