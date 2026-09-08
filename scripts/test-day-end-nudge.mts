/**
 * Exercises the end-of-day "how was the app" prompt, then cleans up after
 * itself.
 *
 *   npx tsx scripts/test-day-end-nudge.mts
 *
 * The prompt fires half an hour after the last session of the *local* day, so
 * this plants a session that finished 35 minutes ago and lets the real tick
 * find it. Nothing about the announcer is stubbed: the push actually goes to
 * subscribed devices, which is the only way to know it works.
 *
 * It also proves the half that matters most - that a second tick does not ask
 * again. This prompt fires once for the whole conference, so a double send is
 * not a duplicate notification, it is the difference between one buzz and a
 * channel people turn off.
 */
import fs from "node:fs";
import pg from "pg";

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const { runAnnouncerTick } = await import("../lib/announcer");
const { roomForTrack } = await import("../lib/program");

const ref = process.env.NEXT_PUBLIC_SUPABASE_URL!.match(/https:\/\/([^.]+)\./)![1];
const db = new pg.Client({
  host: "aws-1-eu-west-1.pooler.supabase.com", port: 5432,
  user: `postgres.${ref}`, password: process.env.SUPABASE_DB_PASSWORD,
  database: "postgres", ssl: { rejectUnauthorized: false },
});
await db.connect();

const MARK = "DAY-END-TEST";

// Long enough ago to clear the 25-minute per-session prompt window, so this
// test can only be measuring the day-end ask and nothing else.
const ends = new Date(Date.now() - 35 * 60_000);
const starts = new Date(ends.getTime() - 25 * 60_000);

await db.query(
  `insert into public.sessions (track, title, speaker_name, starts_at, ends_at, room, notes)
   values ('open', 'Day-end smoke test', 'Test Speaker', $1, $2, $3, $4)`,
  [starts.toISOString(), ends.toISOString(), roomForTrack("open"), MARK],
);
await db.query(
  "update public.app_settings set app_rating_nudge_sent_at = null where id = true",
);

const who = await db.query(`
  select count(distinct s.profile_id) as n
  from public.push_subscriptions s
  where not exists (
    select 1 from public.ratings r
    where r.profile_id = s.profile_id and r.subject = 'app')`);
console.log(`people who should be asked: ${who.rows[0].n}`);

console.log("\ntick 1 (should ask):", await runAnnouncerTick());
console.log("tick 2 (must NOT ask again):", await runAnnouncerTick());

const { rows } = await db.query(
  "select app_rating_nudge_sent_at from public.app_settings where id = true",
);
console.log(`\nclaim stamped: ${rows[0].app_rating_nudge_sent_at ? "yes ✓" : "no ✗"}`);

await db.query("delete from public.sessions where notes = $1", [MARK]);
await db.query(
  "update public.app_settings set app_rating_nudge_sent_at = null where id = true",
);
console.log("cleaned up (claim reset, so the real one can still fire).");
await db.end();
