/**
 * Seeds DUMMY attendee profiles so the Networking directory can be designed
 * and tested before real attendees exist.
 *
 *   node scripts/seed-people.mjs          insert
 *   node scripts/seed-people.mjs --clear  remove them again
 *
 * Every seeded account uses an @dummy.aicinfo.test address, which is how
 * --clear finds them. Real profiles are never touched.
 *
 * Names carry Nordic characters on purpose so the directory's search folding
 * and the layout get tested against realistic input.
 */
import fs from "node:fs";
import pg from "pg";

const DUMMY_DOMAIN = "dummy.aicinfo.test";

const PEOPLE = [
  ["Astrid", "Nørgaard-Bech", true, "Nordisk AI", "Principal Engineer"],
  ["Mikkel", "Thorvaldsen", true, "Vestas", "Head of Data"],
  ["Camilla", "Ødegård", true, "Maersk", "ML Lead"],
  ["Frederik", "Aagaard", true, "Novo Nordisk", "Research Scientist"],
  ["Ingrid", "Sælandsdóttir", true, "Corti", "Staff Engineer"],
  ["Line", "Hvidberg", false, "Danske Bank", "Product Designer"],
  ["Nikolaj", "Steenbæk", false, "Trustpilot", "Backend Engineer"],
  ["Sofie", "Ravnkilde", false, "Zendesk", "Engineering Manager"],
  ["Emil", "Kristoffersen", false, "Unity", "Data Scientist"],
  ["Maja", "Overgaard Lund", false, "Ørsted", "Strategy Lead"],
  ["Tobias", "Ellegaard Sørensen", false, "Pleo", "Founder"],
  ["Signe", "Vestergaard Holm", false, "Lunar", "Head of Product"],
  ["Villads", "Rosenkrantz", false, "Templafy", "Solutions Architect"],
  ["Nanna", "Løvgren", false, "Podimo", "Analytics Lead"],
  ["Gustav", "Hillerød", false, "Siteimprove", "Platform Engineer"],
];

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n")
    .map((l) => l.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/))
    .filter(Boolean).map((m) => [m[1], m[2]]),
);
const ref = env.NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/([^.]+)\./)[1];

const slug = (s) =>
  s.toLowerCase()
    .replace(/ø/g, "o").replace(/æ/g, "ae").replace(/å/g, "aa")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]+/g, "");

const client = new pg.Client({
  host: "aws-1-eu-west-1.pooler.supabase.com", port: 5432,
  user: `postgres.${ref}`, password: env.SUPABASE_DB_PASSWORD,
  database: "postgres", ssl: { rejectUnauthorized: false },
});
await client.connect();

if (process.argv.includes("--clear")) {
  const r = await client.query(
    `delete from auth.users where email like $1`, [`%@${DUMMY_DOMAIN}`]);
  console.log(`removed ${r.rowCount} dummy account(s) (profiles cascade)`);
  await client.end();
  process.exit(0);
}

let created = 0;
for (const [first, last, isSpeaker, company, role] of PEOPLE) {
  const email = `${slug(first)}.${slug(last)}@${DUMMY_DOMAIN}`;

  const existing = await client.query(
    "select id from auth.users where email = $1", [email]);

  let id = existing.rows[0]?.id;
  if (!id) {
    const ins = await client.query(
      `insert into auth.users
         (instance_id, id, aud, role, email, encrypted_password,
          email_confirmed_at, created_at, updated_at)
       values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(),
               'authenticated', 'authenticated', $1, '', now(), now(), now())
       returning id`, [email]);
    id = ins.rows[0].id;
    created++;
  }

  await client.query(
    `insert into public.profiles (id, first_name, last_name, is_speaker, company, role)
     values ($1,$2,$3,$4,$5,$6)
     on conflict (id) do update set
       first_name = excluded.first_name, last_name = excluded.last_name,
       is_speaker = excluded.is_speaker, company = excluded.company,
       role = excluded.role`,
    [id, first, last, isSpeaker, company, role]);
}

const { rows: [t] } = await client.query(
  `select count(*)::int n, count(*) filter (where is_speaker)::int sp
   from public.profiles`);
console.log(`${created} new account(s) created`);
console.log(`profiles now: ${t.n} total, ${t.sp} speakers, ${t.n - t.sp} guests`);
await client.end();
