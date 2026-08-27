/**
 * Exercises the schedule clash detection against the live database.
 * Mirrors findClash() exactly, including the mixed-offset timestamps that
 * Postgres returns, which is what the original string comparison got wrong.
 *
 *   npx tsx scripts/test-clash.mts
 */
import fs from "node:fs";
import pg from "pg";
import { timeToIso, timeAt, roomForTrack, type Session } from "../lib/program";

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const ref = process.env.NEXT_PUBLIC_SUPABASE_URL!.match(/https:\/\/([^.]+)\./)![1];
const db = new pg.Client({
  host: "aws-1-eu-west-1.pooler.supabase.com", port: 5432,
  user: `postgres.${ref}`, password: process.env.SUPABASE_DB_PASSWORD,
  database: "postgres", ssl: { rejectUnauthorized: false },
});
await db.connect();

const DEFAULT_LENGTH = 25 * 60_000;
const ms = (iso: string) => new Date(iso).getTime();

/** Same logic as the server action. */
function findClash(
  rows: Session[], room: string, startsAt: string,
  endsAt: string | null, excludeId: string | null,
): Session | null {
  const from = ms(startsAt);
  const to = endsAt ? ms(endsAt) : from + DEFAULT_LENGTH;
  for (const other of rows) {
    if (other.room !== room || other.status !== "scheduled") continue;
    if (excludeId && other.id === excludeId) continue;
    if (!other.speaker_name) continue;
    const otherFrom = ms(other.starts_at);
    const otherTo = other.ends_at ? ms(other.ends_at) : otherFrom + DEFAULT_LENGTH;
    if (otherFrom < to && otherTo > from) return other;
  }
  return null;
}

const { rows } = await db.query(
  "select id, track, title, speaker_name, starts_at, ends_at, room, status from public.sessions");
// Match what supabase-js hands back: ISO strings normalised to +00:00.
const sessions = rows.map((r) => ({
  ...r,
  starts_at: new Date(r.starts_at).toISOString(),
  ends_at: r.ends_at ? new Date(r.ends_at).toISOString() : null,
})) as Session[];

// Use an empty part of the day so neighbouring sessions cannot muddy the
// result — the seeded Demos track is back-to-back all morning, so "clear"
// cases there would collide with a different session and prove nothing.
const MARK = "CLASH-TEST";
await db.query("delete from public.sessions where notes = $1", [MARK]);
await db.query(
  `insert into public.sessions (track, title, speaker_name, starts_at, ends_at, room, notes)
   values ('demos', 'Clash fixture', 'Test Speaker', $1, $2, $3, $4)`,
  [timeToIso("20:00"), timeToIso("20:25"), roomForTrack("demos"), MARK],
);

const { rows: rows2 } = await db.query(
  "select id, track, title, speaker_name, starts_at, ends_at, room, status from public.sessions");
const pool = rows2.map((r) => ({
  ...r,
  starts_at: new Date(r.starts_at).toISOString(),
  ends_at: r.ends_at ? new Date(r.ends_at).toISOString() : null,
})) as Session[];

console.log("Fixture: a Demos session at 20:00-20:25, in an otherwise empty slot");
console.log("");

const cases: [string, string, string | null, boolean][] = [
  ["exact same slot",                 "20:00", "20:25", true],
  ["starts mid-way through it",       "20:10", "20:35", true],
  ["ends mid-way through it",         "19:50", "20:10", true],
  ["fully contains it",               "19:30", "21:00", true],
  ["back-to-back, starts at its end", "20:25", "20:50", false],
  ["back-to-back, ends at its start", "19:35", "20:00", false],
  ["hours earlier",                   "08:35", "08:55", false],
];

let failures = 0;
for (const [label, start, end, shouldClash] of cases) {
  const hit = findClash(
    pool, roomForTrack("demos"), timeToIso(start),
    end ? timeToIso(end) : null, null,
  );
  const got = Boolean(hit);
  const ok = got === shouldClash;
  if (!ok) failures++;
  console.log(
    `  ${ok ? "✓" : "✗"} ${label.padEnd(34)} ${start}–${end}  ` +
    `→ ${got ? `clash with "${hit!.title.slice(0, 22)}"` : "clear"} (want ${shouldClash ? "clash" : "clear"})`,
  );
}

// A different room at the same time must never clash.
const otherRoom = findClash(
  pool, roomForTrack("main"), timeToIso("20:00"), timeToIso("20:25"), null);
if (otherRoom) { failures++; console.log("  ✗ same time in Main stage → clashed (want clear)"); }
else console.log("  ✓ same time but a different room       20:00–20:25  → clear (want clear)");

await db.query("delete from public.sessions where notes = $1", [MARK]);

// The exact scenario reported: moving a Main stage session into Demos.
const demosLive = pool
  .filter((s) => s.track === "demos" && s.speaker_name && s.notes !== MARK)
  .sort((a, b) => ms(a.starts_at) - ms(b.starts_at))[1];
const main = pool.find(
  (s) => s.track === "main" && s.speaker_name &&
    ms(s.starts_at) === ms(demosLive.starts_at));
if (main) {
  const hit = findClash(
    pool, roomForTrack("demos"), main.starts_at, main.ends_at, main.id);
  const ok = Boolean(hit);
  if (!ok) failures++;
  console.log(
    `\n  ${ok ? "✓" : "✗"} moving "${main.title.slice(0, 30)}" from Main stage to Demos ` +
    `at ${timeAt(main.starts_at)} → ${ok ? `clashes with "${hit!.title.slice(0, 30)}"` : "NOT DETECTED"}`,
  );
} else {
  console.log("\n  (no same-time Main stage session to test the reported case with)");
}

console.log(failures ? `\n${failures} FAILURE(S)` : "\nAll cases correct.");
await db.end();
process.exit(failures ? 1 : 0);
