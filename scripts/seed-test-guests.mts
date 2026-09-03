/**
 * Ten non-speaker test profiles, so the directory and the feed have realistic
 * guests to work with before the real attendee list arrives.
 *
 *   npx tsx scripts/seed-test-guests.mts
 *   npx tsx scripts/seed-test-guests.mts --clear
 *
 * All use plus-addressing on one real inbox, so every sign-in email actually
 * arrives somewhere you can read:
 *
 *   dangomezwindshuttle+first_last@gmail.com
 *
 * That also makes them trivial to find and remove later — they are the only
 * accounts with a "+" in the address.
 */
import fs from "node:fs";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { titleCaseName } from "../lib/names";

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const INBOX = "dangomezwindshuttle";
const DOMAIN = "gmail.com";

const GUESTS: [string, string, string, string][] = [
  // Test Guy leads, because he is the one the test plan walks through.
  ["Test", "Guy", "Novo Nordisk", "Product Manager"],
  ["Freja", "Lindqvist", "Danske Bank", "Data Scientist"],
  ["Emil", "Kristoffersen", "Trustpilot", "Backend Engineer"],
  ["Maja", "Overgaard Lund", "Ørsted", "Strategy Lead"],
  ["Nikolaj", "Steenbæk", "Zendesk", "Engineering Manager"],
  ["Signe", "Vestergaard Holm", "Lunar", "Head of Product"],
  ["Tobias", "Ellegaard Sørensen", "Pleo", "Founder"],
  ["Nanna", "Løvgren", "Podimo", "Analytics Lead"],
  ["Villads", "Rosenkrantz", "Templafy", "Solutions Architect"],
  ["Camilla", "Ødegård", "Maersk", "UX Researcher"],
];

const slug = (s: string) =>
  s.toLowerCase()
    .replace(/ø/g, "o").replace(/æ/g, "ae").replace(/å/g, "aa")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]+/g, "");

const emailFor = (first: string, last: string) =>
  `${INBOX}+${slug(first)}_${slug(last)}@${DOMAIN}`;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ref = SUPABASE_URL.match(/https:\/\/([^.]+)\./)![1];
const admin = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const db = new pg.Client({
  host: "aws-1-eu-west-1.pooler.supabase.com", port: 5432,
  user: `postgres.${ref}`, password: process.env.SUPABASE_DB_PASSWORD,
  database: "postgres", ssl: { rejectUnauthorized: false },
});
await db.connect();

if (process.argv.includes("--clear")) {
  const r = await db.query(
    "delete from auth.users where email like $1", [`${INBOX}+%@${DOMAIN}`]);
  console.log(`removed ${r.rowCount} test guest(s) — profiles cascade`);
  await db.end();
  process.exit(0);
}

let created = 0, updated = 0;
const rows: string[] = [];

for (const [first, last, company, role] of GUESTS) {
  const email = emailFor(first, last);

  const existing = await db.query("select id from auth.users where email = $1", [email]);
  let id = existing.rows[0]?.id as string | undefined;

  if (!id) {
    const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
    if (error || !data.user) {
      console.log(`  FAILED ${first} ${last}: ${error?.message}`);
      continue;
    }
    id = data.user.id;
    created++;
  } else {
    updated++;
  }

  await db.query(
    `insert into public.profiles
       (id, first_name, last_name, is_speaker, company, role, is_prefilled)
     values ($1,$2,$3,false,$4,$5,true)
     on conflict (id) do update set
       first_name = excluded.first_name,
       last_name  = excluded.last_name,
       is_speaker = false,
       company    = excluded.company,
       role       = excluded.role,
       is_prefilled = true`,
    [id, titleCaseName(first), titleCaseName(last), company, role],
  );

  rows.push(`  ${(first + " " + last).padEnd(26)} ${email}`);
}

console.log(`created ${created}, updated ${updated}\n`);
console.log(rows.join("\n"));

const { rows: [t] } = await db.query(
  `select count(*)::int n,
          count(*) filter (where is_speaker)::int sp
   from public.profiles`);
console.log(`\nprofiles: ${t.n} total, ${t.sp} speakers, ${t.n - t.sp} guests`);
await db.end();
