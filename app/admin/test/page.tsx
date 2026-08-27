import { createAdminClient } from "@/lib/supabase/admin";
import {
  createTestSession, runAnnouncerNow, sendTestPush, clearTestData,
} from "@/app/actions/test-tools";
import { TEST_MARK } from "@/lib/test-mark";
import { timeAt } from "@/lib/program";
import SubmitButton from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

const btn =
  "rounded-lg border border-[var(--color-line)] px-3.5 py-2.5 text-sm font-medium";

export default async function TestToolsPage() {
  const admin = createAdminClient();
  const [{ data: pending }, { count: subs }, { data: autoPosts }] = await Promise.all([
    admin
      .from("sessions")
      .select("id, title, starts_at, announced_at")
      .eq("notes", TEST_MARK)
      .order("starts_at", { ascending: true }),
    admin.from("push_subscriptions").select("id", { count: "exact", head: true }),
    admin
      .from("posts")
      .select("id, body, created_at")
      .eq("kind", "auto")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const pushConfigured = Boolean(
    process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  );

  return (
    <section>
      <h1 className="text-2xl font-bold tracking-tight">Testing tools</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        For rehearsal. The real programme is all on 10 September, so nothing in it
        can reach the announcer&rsquo;s window until the day — these create sessions
        dated <strong>today</strong> instead. All times are Copenhagen time.
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
              <SubmitButton className={btn} pendingLabel="Adding…">
                +{m} min
              </SubmitButton>
            </form>
          ))}
          <form action={runAnnouncerNow}>
            <SubmitButton
              className={`${btn} border-[var(--color-accent)] text-[var(--color-accent)]`}
              pendingLabel="Running…"
            >
              Run announcer now
            </SubmitButton>
          </form>
        </div>

        {(pending?.length ?? 0) > 0 && (
          <ul className="mt-3 space-y-1 border-t border-[var(--color-line)] pt-3 text-sm">
            {pending!.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3">
                <span className="truncate text-[var(--color-muted)]">
                  <span className="font-mono tabular-nums">{timeAt(s.starts_at)}</span>{" "}
                  {s.title}
                </span>
                <span
                  className={
                    s.announced_at ? "shrink-0 text-green-600" : "shrink-0 text-[var(--color-muted)]"
                  }
                >
                  {s.announced_at ? "announced ✓" : "waiting"}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Shows what actually landed in the feed, so there is no need to go
            looking for it — and no risk of cleaning up before checking. */}
        <div className="mt-3 border-t border-[var(--color-line)] pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Latest automatic posts in the feed
          </p>
          {(autoPosts?.length ?? 0) === 0 ? (
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              None yet.
            </p>
          ) : (
            <ul className="mt-1 space-y-1 text-sm">
              {autoPosts!.map((p) => (
                <li key={p.id} className="text-[var(--color-muted)]">
                  · {p.body}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* --- push --- */}
      <div className="mt-4 rounded-xl border border-[var(--color-line)] p-4">
        <p className="font-semibold">2. Test notifications</p>

        {!pushConfigured ? (
          <p className="mt-2 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm">
            <strong>Not configured.</strong> The VAPID keys are missing from this
            deployment, so nobody can subscribe and nothing will send. Paste the
            contents of <code>railway-vars.txt</code> into Railway &rarr; Variables
            &rarr; Raw Editor, then redeploy.
          </p>
        ) : (
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Sends to every subscribed device. Currently <strong>{subs ?? 0}</strong>{" "}
            subscribed. If that says 0, turn notifications on from your profile first.
          </p>
        )}

        <form action={sendTestPush} className="mt-3">
          <SubmitButton className={btn} pendingLabel="Sending…">
            Send a test notification
          </SubmitButton>
        </form>
      </div>

      {/* --- cleanup --- */}
      <div className="mt-4 rounded-xl border border-[var(--color-line)] p-4">
        <p className="font-semibold">3. Clean up</p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Removes only sessions created here and the posts they generated. The
          real programme and any genuine updates are untouched.{" "}
          <strong>Check the feed before you do this</strong> — it deletes the
          announcements too.
        </p>
        <form action={clearTestData} className="mt-3">
          <SubmitButton
            className={`${btn} text-red-600`}
            pendingLabel="Removing…"
            confirm="Remove all test sessions and the posts they generated?"
          >
            Remove test sessions and their posts
          </SubmitButton>
        </form>
      </div>
    </section>
  );
}
