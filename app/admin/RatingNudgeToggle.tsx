import { createClient } from "@/lib/supabase/server";
import { setRatingNudge } from "@/app/actions/settings";

/**
 * Asks people who starred a session how it was, once it has finished.
 *
 * Separate from the announcer switch on purpose: schedule notices and rating
 * prompts are different bargains with someone's attention, and on the day you
 * may want one without the other.
 */
export default async function RatingNudgeToggle() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("rating_nudge")
    .maybeSingle();

  const on = data?.rating_nudge !== false;

  return (
    <div className="mt-3 rounded-xl border border-[var(--color-line)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">Rating prompts {on ? "on" : "off"}</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {on
              ? "When a session ends, the people who starred it are asked how it was — unless they have already rated it."
              : "Nobody is being asked to rate anything. Ratings still work from the session page."}
          </p>
        </div>
        <form action={setRatingNudge} className="shrink-0">
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
      </div>
    </div>
  );
}
