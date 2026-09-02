import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import Analytics from "./Analytics";

/**
 * Reads who is signed in on the server, so PostHog can attribute events to a
 * person without the client having to ask separately.
 *
 * The id passed is the Supabase user id — an opaque UUID. No email or name
 * reaches the analytics provider.
 */
export default async function AnalyticsProvider() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <Suspense fallback={null}>
      <Analytics distinctId={user?.id ?? null} />
    </Suspense>
  );
}
