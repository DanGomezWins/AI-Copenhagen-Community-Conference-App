import { createAdminClient } from "@/lib/supabase/admin";
import {
  createTestSession, runAnnouncerNow, sendTestPush, clearTestData,
} from "@/app/actions/test-tools";
import { TEST_MARK } from "@/lib/test-mark";

export const dynamic = "force-dynamic";

const btn =
  "rounded-lg border border-[var(--color-line)] px-3.5 py-2.5 text-sm font-medium";

export default async function TestToolsPage() {
  const admin = createAdminClient();
  const [{ data: pending }, { count: subs }] = await Promise.all([
    admin.from("sessions").select("id, title, starts_at, announced_at").eq("notes", TEST_MARK),
    admin.from("push_subscriptions").select("id", { count: "exact", head: true }),
  ]);

  return (
    <section>
      <h1 className="text-2xl font-bold tracking-tight">Testing tools</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        For rehearsal. The real programme is all on 10 September, so nothing in it
        can reach the announcer’s window until the day — these create sessions
        dated <strong>today</strong> instead.
      </p>

      {/* --- announcer --- */}
      <div className="mt-6 rounded-xl border border-[var(--color-line)] p-4">
        <p className="font-semibold">1. Test the auto-announcer</p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Make a session a few minutes out, then wait. The scheduler ticks every
          minute and posts five minutes before a session starts — so a session
          3 minutes away is already inside the window and fires on the next tick.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {[3, 10, 30].map((m) => (
            <form key={m} action={createTestSession}>
              <input type="hidden" name="minutes" value={m} />
              <button type="submit" className={btn}>+{m} min</button>
            </form>
          ))}
          <form action={runAnnouncerNow}>
            <button type="submit" className={`${btn} border-[var(--color-accent)] text-[var(--color-accent)]`}>
              Run announcer now
            </button>
          </form>
        </div>

        {(pending?.length ?? 0) > 0 && (
          <ul className="mt-3 space-y-1 border-t border-[var(--color-line)] pt-3 text-sm">
            {pending!.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3">
                <span className="truncate text-[var(--color-muted)]">{s.title}</span>
                <span className={s.announced_at ? "text-green-600" : "text-[var(--color-muted)]"}>
                  {s.announced_at ? "announced ✓" : "waiting"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* --- push --- */}
      <div className="mt-4 rounded-xl border border-[var(--color-line)] p-4">
        <p className="font-semibold">2. Test notifications</p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Sends to every subscribed device. Currently <strong>{subs ?? 0}</strong>{" "}
          subscribed. If that says 0, turn notifications on from your profile first.
        </p>
        <form action={sendTestPush} className="mt-3">
          <button type="submit" className={btn}>Send a test notification</button>
        </form>
      </div>

      {/* --- cleanup --- */}
      <div className="mt-4 rounded-xl border border-[var(--color-line)] p-4">
        <p className="font-semibold">3. Clean up</p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Removes only sessions created here and the posts they generated. The
          real programme and any genuine updates are untouched.
        </p>
        <form action={clearTestData} className="mt-3">
          <button type="submit" className={`${btn} text-red-600`}>
            Remove test sessions and their posts
          </button>
        </form>
      </div>
    </section>
  );
}
