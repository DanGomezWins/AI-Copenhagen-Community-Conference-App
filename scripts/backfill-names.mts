/**
 * Title-cases names already in the database, so existing rows match the new
 * save-time normalisation. Safe to re-run.
 *
 *   npx tsx scripts/backfill-names.mts
 */
import fs from "node:fs";
import pg from "pg";
import { titleCaseName } from "../lib/names";

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

let changed = 0;

const { rows: profiles } = await db.query("select id, first_name, last_name from public.profiles");
for (const p of profiles) {
  const f = titleCaseName(p.first_name);
  const l = titleCaseName(p.last_name);
  if (f !== p.first_name || l !== p.last_name) {
    await db.query("update public.profiles set first_name=$2, last_name=$3 where id=$1", [p.id, f, l]);
    console.log(`  profile: "${p.first_name} ${p.last_name}" → "${f} ${l}"`);
    changed++;
  }
}

const { rows: sessions } = await db.query(
  "select id, speaker_name from public.sessions where speaker_name is not null");
for (const s of sessions) {
  const n = titleCaseName(s.speaker_name);
  if (n !== s.speaker_name) {
    await db.query("update public.sessions set speaker_name=$2 where id=$1", [s.id, n]);
    console.log(`  session: "${s.speaker_name}" → "${n}"`);
    changed++;
  }
}

console.log(changed ? `\n${changed} row(s) updated.` : "\nNothing to change — all names already title-cased.");
await db.end();
