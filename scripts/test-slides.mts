/**
 * Checks slide auto-posting: a finished session WITH a slides URL announces
 * once; a finished session WITHOUT one announces never.
 *
 *   npx tsx scripts/test-slides.mts
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

const MARK = "SLIDES-TEST";
await db.query("delete from public.posts where session_id in (select id from public.sessions where notes=$1)", [MARK]);
await db.query("delete from public.sessions where notes = $1", [MARK]);

// Both finished 20 minutes ago; only one has slides.
const ended = new Date(Date.now() - 20 * 60_000);
const started = new Date(ended.getTime() - 25 * 60_000);

const mk = async (title: string, slides: string | null) => {
  const { rows: [r] } = await db.query(
    `insert into public.sessions
       (track, title, speaker_name, starts_at, ends_at, room, notes, slides_url)
     values ('main', $1, 'Test Speaker', $2, $3, 'Main stage', $4, $5) returning id`,
    [title, started.toISOString(), ended.toISOString(), MARK, slides],
  );
  return r.id as string;
};

const withSlides = await mk("Session WITH slides", "https://example.com/deck.pdf");
const without = await mk("Session WITHOUT slides", null);

// Stamp announced_at so the "next up" half ignores these and only slides run.
await db.query("update public.sessions set announced_at = now() where notes = $1", [MARK]);

const t1 = await runAnnouncerTick();
const t2 = await runAnnouncerTick();
const t3 = await runAnnouncerTick();

const countFor = async (id: string) =>
  (await db.query("select count(*)::int n from public.posts where session_id = $1", [id]))
    .rows[0].n as number;

const a = await countFor(withSlides);
const b = await countFor(without);

const body = (await db.query(
  "select body from public.posts where session_id = $1 limit 1", [withSlides])).rows[0]?.body;

console.log(`tick 1: ${JSON.stringify(t1)}`);
console.log(`tick 2: ${JSON.stringify(t2)}`);
console.log(`tick 3: ${JSON.stringify(t3)}`);
console.log();

let fail = 0;
const check = (ok: boolean, label: string) => {
  if (!ok) fail++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}`);
};

check(a === 1, `session WITH slides announced exactly once (got ${a})`);
check(b === 0, `session WITHOUT slides announced never (got ${b})`);
check(Boolean(body?.includes("Slides are now available")), "post says slides are available");
check(t1.slides === 1 && t2.slides === 0 && t3.slides === 0, "no double-posting across ticks");

// Changing the URL should let it announce again.
await db.query("update public.sessions set slides_url = $2 where id = $1",
  [withSlides, "https://example.com/deck-v2.pdf"]);
const { rows: [after] } = await db.query(
  "select slides_announced_at from public.sessions where id = $1", [withSlides]);
check(after.slides_announced_at === null, "changing the slides URL clears the stamp");

const t4 = await runAnnouncerTick();
check(t4.slides === 1, "re-announces after the URL changes");

await db.query("delete from public.posts where session_id in (select id from public.sessions where notes=$1)", [MARK]);
await db.query("delete from public.sessions where notes = $1", [MARK]);
console.log(fail ? `\n${fail} FAILURE(S)` : "\nAll correct. Cleaned up.");
await db.end();
process.exit(fail ? 1 : 0);
