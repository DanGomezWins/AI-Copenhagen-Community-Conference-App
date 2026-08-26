import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { setCancelled } from "@/app/actions/sessions";
import { TRACKS, timeRange, isStructural, type Session } from "@/lib/program";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sessions")
    .select("*")
    .order("starts_at", { ascending: true });
  const sessions = (data ?? []) as Session[];

  return (
    <section>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Changing a time or room posts a notice to the feed automatically.
          </p>
        </div>
        <Link
          href="/admin/schedule/new"
          className="shrink-0 rounded-lg bg-[var(--color-accent)] px-3.5 py-2 text-sm font-medium text-white"
        >
          Add
        </Link>
      </div>

      {TRACKS.map((t) => {
        const rows = sessions.filter((s) => s.track === t.key);
        return (
          <div key={t.key} className="mt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              {t.label} · {rows.length}
            </h2>
            <ul className="mt-2 divide-y divide-[var(--color-line)] rounded-xl border border-[var(--color-line)]">
              {rows.length === 0 && (
                <li className="p-3.5 text-sm text-[var(--color-muted)]">
                  Nothing scheduled.
                </li>
              )}
              {rows.map((s) => (
                <li key={s.id} className="flex items-center gap-3 p-3">
                  <span className="shrink-0 font-mono text-xs tabular-nums text-[var(--color-muted)]">
                    {timeRange(s.starts_at, s.ends_at)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-medium ${
                        s.status === "cancelled" ? "line-through opacity-60" : ""
                      }`}
                    >
                      {s.title}
                    </p>
                    <p className="truncate text-xs text-[var(--color-muted)]">
                      {isStructural(s) ? "Day structure" : s.speaker_name}
                      {s.room ? ` · ${s.room}` : ""}
                    </p>
                  </div>
                  <form action={setCancelled} className="shrink-0">
                    <input type="hidden" name="id" value={s.id} />
                    <input
                      type="hidden"
                      name="cancel"
                      value={s.status === "cancelled" ? "false" : "true"}
                    />
                    <button type="submit" className="text-xs font-medium text-[var(--color-muted)]">
                      {s.status === "cancelled" ? "Restore" : "Cancel"}
                    </button>
                  </form>
                  <Link
                    href={`/admin/schedule/${s.id}`}
                    className="shrink-0 text-xs font-medium text-[var(--color-accent)]"
                  >
                    Edit
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
