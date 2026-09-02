import { createClient } from "@/lib/supabase/server";
import { setAutoAnnounce } from "@/app/actions/settings";

export default async function AnnouncerToggle() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("auto_announce")
    .maybeSingle();

  const on = data?.auto_announce !== false;

  return (
    <div
      className={`mt-6 rounded-xl border p-4 ${
        on ? "border-[var(--color-line)]" : "border-[var(--color-danger)] bg-[var(--color-danger-soft)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">
            Automatic announcements {on ? "on" : "off"}
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {on
              ? "“Next up” posts five minutes before each session, plus breaks and lunch."
              : "Nothing is being posted automatically. Turn this back on when the schedule is accurate again."}
          </p>
        </div>
        <form action={setAutoAnnounce} className="shrink-0">
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

      {on && (
        <p className="mt-3 border-t border-[var(--color-line)] pt-3 text-xs text-[var(--color-muted)]">
          If the day runs late and the schedule drifts, turn this off rather than
          letting it announce sessions that aren’t happening.
        </p>
      )}
    </div>
  );
}
