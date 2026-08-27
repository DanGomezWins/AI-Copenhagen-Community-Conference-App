/**
 * Resets the app to a clean demo state for a fresh reviewer:
 *   - empties the Feed
 *   - clears any scan drafts and test-tool leftovers
 *   - restores the placeholder programme and placeholder attendees
 *
 * Real profiles and the organiser list are left alone.
 *
 *   npx tsx scripts/reset-demo.mts
 */
import fs from "node:fs";
import pg from "pg";

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

const before = {
  posts: (await db.query("select count(*)::int n from public.posts")).rows[0].n,
  sessions: (await db.query("select count(*)::int n from public.sessions")).rows[0].n,
  profiles: (await db.query("select count(*)::int n from public.profiles")).rows[0].n,
  drafts: (await db.query("select count(*)::int n from public.schedule_drafts")).rows[0].n,
};

// Feed starts empty — the reviewer posts the first update themselves.
await db.query("delete from public.posts");
await db.query("delete from public.schedule_drafts");

// Every session goes, including any left by the scanner or the testing tools,
// so the programme is exactly the placeholder set and nothing else.
await db.query("delete from public.sessions");

// Automatic announcements back on.
await db.query("update public.app_settings set auto_announce = true where id = true");

const after = {
  posts: (await db.query("select count(*)::int n from public.posts")).rows[0].n,
  sessions: (await db.query("select count(*)::int n from public.sessions")).rows[0].n,
  profiles: (await db.query("select count(*)::int n from public.profiles")).rows[0].n,
};

console.log("cleared:");
console.log(`  feed posts      ${before.posts} -> ${after.posts}`);
console.log(`  sessions        ${before.sessions} -> ${after.sessions}  (reseeded next)`);
console.log(`  scan drafts     ${before.drafts} -> 0`);
console.log(`  profiles kept   ${after.profiles}`);
console.log("\nNow run:  node scripts/seed-program.mjs  &&  node scripts/seed-people.mjs");
await db.end();
