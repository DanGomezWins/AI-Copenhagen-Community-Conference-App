import { createClient } from "@/lib/supabase/server";
import { setAppRatingNudge } from "@/app/actions/settings";

/**
 * Asks everyone who has not rated the app how it went, once the day is over.
 *
 * Separate from the per-session prompt above it: this fires once, half an hour
 * after the last session, and is the only thing that produces the app's own
 * rating. Turning off the session prompts should not silently take it too.
 */
export default async function AppRatingNudgeToggle() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("app_rating_nudge, app_rating_nudge_sent_at")
    .maybeSingle();

  const on = data?.app_rating_nudge !== false;
  const sent = Boolean(data?.app_rating_nudge_sent_at);

  return (
    <div className="mt-3 rounded-xl border border-[var(--color-line)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">
            End-of-day app feedback {sent ? "sent" : on ? "on" : "off"}
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {sent
              ? "Already went out. It only ever sends once, so this will not fire again."
              : on
                ? "Half an hour after the last session, everyone who has not yet rated the app is asked to."
                : "Nobody will be asked to rate the app. They can still rate it from the About page."}
          </p>
        </div>
        {!sent && (
          <form action={setAppRatingNudge} className="shrink-0">
            <input type="hidden" name="on" value={on ? "false" : "true"} />
            <button
              type="submit"
              className={`rounded-lg px-3.5 py-2 text-sm font-medium ${
                on
                  ? "border border-[var(--color-line)]"
                  : "bg-[var(--color-accent)] text-white"
              }`}
            >
              {on ? "Turn off" : "Turn on"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
