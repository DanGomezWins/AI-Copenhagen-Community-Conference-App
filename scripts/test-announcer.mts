/**
 * Exercises the auto-announcer against the live database using a temporary
 * session placed in the announcement window, then cleans up after itself.
 *
 *   npx tsx scripts/test-announcer.mts
 */
import fs from "node:fs";
import pg from "pg";

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const { runAnnouncerTick } = await import("../lib/announcer");

const ref = process.env.NEXT_PUBLIC_SUPABASE_URL!.match(/https:\/\/([^.]+)\./)![1];
const db = new pg.Client({
  host: "aws-1-eu-west-1.pooler.supabase.com", port: 5432,
  user: `postgres.${ref}`, password: process.env.SUPABASE_DB_PASSWORD,
  database: "postgres", ssl: { rejectUnauthorized: false },
});
await db.connect();

const MARK = "ANNOUNCER-TEST";
await db.query("delete from public.sessions where notes = $1", [MARK]);

// Three minutes out: inside the 5-minute lead window.
const soon = new Date(Date.now() + 3 * 60_000);
const { rows: [s] } = await db.query(
  `insert into public.sessions (track, title, speaker_name, starts_at, ends_at, room, notes)
   values ('open', $1, 'Test Speaker', $2, $3, 'Room 3', $4) returning id`,
  ["Announcer smoke test", soon.toISOString(),
   new Date(soon.getTime() + 25 * 60_000).toISOString(), MARK],
);

const postsBefore = (await db.query("select count(*)::int n from public.posts")).rows[0].n;

console.log("tick 1 (should post):", await runAnnouncerTick());
console.log("tick 2 (must NOT double-post):", await runAnnouncerTick());
console.log("tick 3 (must NOT double-post):", await runAnnouncerTick());

const postsAfter = (await db.query("select count(*)::int n from public.posts")).rows[0].n;
console.log(`\nposts created across three ticks: ${postsAfter - postsBefore} (want exactly 1)`);

const { rows: made } = await db.query(
  "select body, kind, track from public.posts where session_id = $1", [s.id]);
for (const p of made) console.log(`  [${p.kind}/${p.track}] ${p.body}`);

// A rescheduled session must announce again, not be skipped.
await db.query(
  "update public.sessions set starts_at = $2 where id = $1",
  [s.id, new Date(Date.now() + 4 * 60_000).toISOString()]);
const { rows: [after] } = await db.query(
  "select announced_at from public.sessions where id = $1", [s.id]);
console.log(`\nafter reschedule, announced_at cleared: ${after.announced_at === null ? "yes ✓" : "NO ✗"}`);

console.log("tick 4 (should re-announce):", await runAnnouncerTick());
const finalCount = (await db.query(
  "select count(*)::int n from public.posts where session_id = $1", [s.id])).rows[0].n;
console.log(`total posts for this session: ${finalCount} (want 2 — original + reschedule)`);

// Kill switch.
await db.query("update public.app_settings set auto_announce = false where id = true");
await db.query("update public.sessions set announced_at = null where id = $1", [s.id]);
console.log("\ntick 5 with kill switch off:", await runAnnouncerTick());
await db.query("update public.app_settings set auto_announce = true where id = true");

await db.query("delete from public.posts where session_id = $1", [s.id]);
await db.query("delete from public.sessions where notes = $1", [MARK]);
console.log("\ncleaned up.");
await db.end();
