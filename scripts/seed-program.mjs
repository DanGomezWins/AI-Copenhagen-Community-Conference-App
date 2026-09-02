/**
 * Seeds a DUMMY programme so the Program tab can be designed and tested
 * before the real schedule exists.
 *
 *   node scripts/seed-program.mjs          insert (skips if already seeded)
 *   node scripts/seed-program.mjs --reset  delete dummy rows, then insert
 *   node scripts/seed-program.mjs --clear  delete dummy rows only
 *
 * Every row it writes is tagged notes='DUMMY' so real data can never be
 * confused with it, and so --clear is exact rather than a truncate.
 *
 * Speaker names are FICTIONAL on purpose. The 15 real speakers are public
 * but their topics are not announced, and attaching invented talk titles to
 * real, identifiable people is not something to leave lying in a database.
 * Names deliberately include Danish diacritics and long surnames so the UI
 * gets tested against realistic rendering.
 */
import fs from "node:fs";
import pg from "pg";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n")
    .map((l) => l.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/))
    .filter(Boolean).map((m) => [m[1], m[2]]),
);
const ref = env.NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/([^.]+)\./)[1];

// Thursday 10 September 2026 is CEST (UTC+2).
const D = "2026-09-10";
const at = (hhmm) => `${D}T${hhmm}:00+02:00`;

// 20 minute talk + 5 minute Q&A = 25 minute slots, per the published format.
const MORNING = ["09:30", "09:55", "10:20", "11:00", "11:25"];
const AFTERNOON = ["12:50", "13:15", "13:40", "14:15", "14:40", "15:05"];
const SLOTS = [...MORNING, ...AFTERNOON];
const end = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  const t = h * 60 + m + 25;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};

// The three tracks are the three rooms; there are no separate room numbers.
const ROOM = { main: "Main stage", demos: "Demos", open: "Open sessions" };

// The placeholder programme now uses the REAL speakers, so a reviewer sees
// actual names, photos and bios rather than invented ones. Talk titles remain
// placeholders until the real programme arrives 24-48h before the event.
const SPEAKERS = JSON.parse(
  fs.readFileSync("Assets/speakers.json", "utf8"),
).map((s) => s.name);

const TITLES = [
  "Shipping Agents That Survive Contact With Users",
  "What We Learned Deploying LLMs to 4,000 Employees",
  "The Evaluation Problem Nobody Wants to Talk About",
  "RAG Is Not a Strategy",
  "Designing for Models That Are Confidently Wrong",
  "From Prototype to Production in Regulated Industries",
  "Cutting Inference Costs by 80% Without Losing Quality",
  "Why Your Agent Keeps Forgetting Things",
  "The Human in the Loop Is Also a Bottleneck",
  "Small Models, Sharp Edges: A Year on the Edge",
  "Live: Building a Voice Agent in 20 Minutes",
  "Demo: Multimodal Search Across 2M Documents",
  "Watch an Agent Debug Its Own Pipeline",
  "Demo: Structured Extraction From Terrible PDFs",
  "Real-Time Translation on a Raspberry Pi",
  "Demo: Evals as a CI Gate",
  "An Agent That Reads Your Calendar and Argues Back",
  "Demo: Fine-Tuning on 200 Examples",
  "Synthetic Data That Isn't Garbage",
  "Open: AI in Danish Public Sector",
  "Open: Prompt Engineering Is Dead, Long Live Context",
  "Open: Hiring for AI Teams in 2026",
  "Open: Should We Be Building This At All?",
  "Open: Show Us Your Worst Failure",
];

const KEYNOTE_TITLE = "What Comes After the Chatbot";

// Assign speakers round-robin so every real speaker appears at least once.
const speakerAt = (i) => SPEAKERS[i % SPEAKERS.length];

const MAIN = TITLES.slice(0, 10).map((t, i) => [speakerAt(i), t]);
const KEYNOTE = [speakerAt(10), KEYNOTE_TITLE];
const DEMOS = TITLES.slice(10, 19).map((t, i) => [speakerAt(i + 11), t]);
const OPEN = TITLES.slice(19, 24).map((t, i) => [speakerAt(i + 20), t]);

const rows = [];
const push = (track, name, title, slot) =>
  rows.push({
    track, title,
    speaker_name: name,
    starts_at: at(slot),
    ends_at: at(end(slot)),
    room: ROOM[track],
  });

MAIN.forEach(([name, t], i) => push("main", name, t, SLOTS[i]));
DEMOS.forEach(([name, t], i) => push("demos", name, t, SLOTS[i]));
OPEN.forEach(([name, t], i) => push("open", name, t, SLOTS[i]));

// Closing keynote, 15:30–16:15 on the main stage.
rows.push({
  track: "main", title: KEYNOTE[1],
  speaker_name: KEYNOTE[0],
  starts_at: at("15:30"), ends_at: at("16:15"), room: ROOM.main,
});

// Fixed day structure — no speaker. Gives the Program tab a complete day and
// gives the auto-announcer its break/lunch markers.
const STRUCTURE = [
  ["Registration, coffee & light breakfast", "08:30", "09:30"],
  ["Morning break", "10:45", "11:00"],
  ["Lunch & networking", "11:50", "12:50"],
  ["Afternoon break", "14:05", "14:15"],
  ["Networking & drinks", "16:15", "17:45"],
];
for (const [title, s, e] of STRUCTURE) {
  rows.push({ track: "main", title, speaker_name: null,
              starts_at: at(s), ends_at: at(e), room: ROOM.main });
}

const client = new pg.Client({
  host: "aws-1-eu-west-1.pooler.supabase.com", port: 5432,
  user: `postgres.${ref}`, password: env.SUPABASE_DB_PASSWORD,
  database: "postgres", ssl: { rejectUnauthorized: false },
});
await client.connect();

const reset = process.argv.includes("--reset");
const clearOnly = process.argv.includes("--clear");

if (reset || clearOnly) {
  const r = await client.query("delete from public.sessions where notes = 'DUMMY'");
  console.log(`cleared ${r.rowCount} dummy session(s)`);
  if (clearOnly) { await client.end(); process.exit(0); }
}

const { rows: [{ n }] } = await client.query(
  "select count(*)::int n from public.sessions where notes = 'DUMMY'");
if (n > 0) {
  console.log(`${n} dummy sessions already present — use --reset to replace.`);
  await client.end(); process.exit(0);
}

for (const r of rows) {
  await client.query(
    `insert into public.sessions
       (track, title, speaker_name, starts_at, ends_at, room, notes)
     values ($1,$2,$3,$4,$5,$6,'DUMMY')`,
    [r.track, r.title, r.speaker_name, r.starts_at, r.ends_at, r.room]);
}

const summary = await client.query(`
  select track, count(*)::int total,
         count(speaker_name)::int with_speaker
  from public.sessions where notes='DUMMY' group by track order by track`);
console.log(`\ninserted ${rows.length} rows:`);
for (const s of summary.rows)
  console.log(`  ${s.track.padEnd(6)} ${String(s.total).padStart(2)} rows, ${s.with_speaker} with a speaker`);
const t = await client.query(
  "select count(*)::int n from public.sessions where notes='DUMMY' and speaker_name is not null");
console.log(`\n  ${t.rows[0].n} speaker sessions total (published figure: 25 talks/demos/open sessions)`);
await client.end();
