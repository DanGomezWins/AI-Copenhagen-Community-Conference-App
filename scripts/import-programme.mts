/**
 * Builds the programme from the two availability CSVs.
 *
 *   npx tsx scripts/import-programme.mts          preview only
 *   npx tsx scripts/import-programme.mts --write  replace the programme
 *
 * IMPORTANT: the CSVs are availability forms, not a finished schedule. They
 * record which slots each speaker *could* do — most list three to eight — and
 * carry no talk titles at all. So this SOLVES an assignment rather than
 * reading one:
 *
 *   - maximum bipartite matching seats as many speakers as possible, each in
 *     exactly one session, and never in two rooms at once
 *   - talk titles and descriptions come from the conference deck, matched by
 *     name (see scripts/extract-speakers-pdf.py)
 *   - speakers in the deck who never returned an availability form are placed
 *     into whatever slots are left, so their talks still show up
 *
 * The result is a plausible draft to test against, not the real programme.
 * Every session it writes is marked notes='DERIVED' so it can be replaced
 * wholesale when the real one arrives.
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { timeToIso, roomForTrack, type TrackKey } from "../lib/program";
import { nameKey, titleCaseName } from "../lib/names";

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const ASSETS = "Assets";
const MARK = "DERIVED";

// ---------- CSV ----------
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (c !== "\r") cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

/** "9:30 - 9:55" -> { start: "09:30", end: "09:55" } */
function parseSlot(raw: string): { start: string; end: string } | null {
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const pad = (h: string, mi: string) => `${h.padStart(2, "0")}:${mi}`;
  return { start: pad(m[1], m[2]), end: pad(m[3], m[4]) };
}

type Entry = { name: string; title: string | null; company: string | null; slots: string[] };

function readAvailability(file: string): Entry[] {
  const rows = parseCsv(fs.readFileSync(path.join(ASSETS, file), "utf8").replace(/^﻿/, ""));
  const out = new Map<string, Entry>();
  for (const r of rows.slice(1)) {
    const name = (r[0] ?? "").trim();
    if (!name) continue;
    const slots = (r[3] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    const key = nameKey(name);
    const existing = out.get(key);
    if (existing) {
      // A speaker listed twice: merge their availability rather than dropping one.
      existing.slots = [...new Set([...existing.slots, ...slots])];
    } else {
      out.set(key, {
        name: titleCaseName(name),
        title: (r[1] ?? "").trim() || null,
        company: (r[2] ?? "").trim() || null,
        slots,
      });
    }
  }
  return [...out.values()];
}

// Talk titles and descriptions come from the conference deck, keyed by name.
type SpeakerTalk = { name: string; title: string | null; company: string | null;
                     talk_title: string | null; talk_description: string | null };
const talks = new Map<string, SpeakerTalk>();
const deck: SpeakerTalk[] = [];
{
  const f = path.join(ASSETS, "speakers.json");
  if (fs.existsSync(f)) {
    for (const s of JSON.parse(fs.readFileSync(f, "utf8")) as SpeakerTalk[]) {
      talks.set(nameKey(s.name), s);
      deck.push(s);
    }
  }
}

const main = readAvailability("AIMC CC speaker overview - Speaker program - main.csv");
const demos = readAvailability("AIMC CC speaker overview - All demos program.csv");

// Every distinct slot mentioned anywhere, in time order.
const ALL_SLOTS = [...new Set([...main, ...demos].flatMap((e) => e.slots))]
  .map((s) => ({ raw: s, parsed: parseSlot(s) }))
  .filter((s): s is { raw: string; parsed: { start: string; end: string } } => Boolean(s.parsed))
  .sort((a, b) => a.parsed.start.localeCompare(b.parsed.start));

type Placement = { track: TrackKey; slot: string; name: string; title: string | null; company: string | null };

type Person = {
  name: string;
  title: string | null;
  company: string | null;
  nodes: string[];   // "track|slot" this person could fill
};

/**
 * Maximum bipartite matching (Kuhn's algorithm), one session per speaker.
 *
 * A greedy pass filled the demos room first and ate slots its people also
 * wanted on the main stage, leaving five speakers off the programme when a
 * valid arrangement existed. Augmenting paths find the best arrangement rather
 * than the first one, and the result does not depend on the order speakers are
 * considered in.
 *
 * Slots nobody can fill are simply left empty. Filling them with a speaker who
 * already has a session would put the same talk on the programme twice, which
 * is worse than a gap an organiser can see and fix.
 */
function solve(): {
  placed: Placement[];
  unplaced: { name: string; track: TrackKey; why: string }[];
} {
  // Someone may appear in both CSVs with different availability; take the
  // union of what they offered rather than letting one file mask the other.
  const people = new Map<string, Person>();
  for (const [track, pool] of [["main", main], ["demos", demos]] as [TrackKey, Entry[]][]) {
    for (const e of pool) {
      const key = nameKey(e.name);
      const nodes = e.slots.map((slot) => `${track}|${slot}`);
      const existing = people.get(key);
      if (existing) {
        existing.nodes = [...new Set([...existing.nodes, ...nodes])];
        existing.title ??= e.title;
        existing.company ??= e.company;
      } else {
        people.set(key, { name: e.name, title: e.title, company: e.company, nodes });
      }
    }
  }

  const matchNode = new Map<string, string>();    // nodeId -> speaker key
  const matchPerson = new Map<string, string>();  // speaker key -> nodeId

  function assign(key: string, seen: Set<string>): boolean {
    for (const id of people.get(key)!.nodes) {
      if (seen.has(id)) continue;
      seen.add(id);
      const holder = matchNode.get(id);
      // Free slot, or the speaker sitting there can move somewhere else.
      if (holder === undefined || assign(holder, seen)) {
        matchNode.set(id, key);
        matchPerson.set(key, id);
        return true;
      }
    }
    return false;
  }

  // Most constrained first. Kuhn's is order-independent for the size of the
  // matching, but this keeps the specific arrangement stable between runs.
  const order = [...people.values()]
    .filter((p) => p.nodes.length > 0)
    .sort((a, b) => a.nodes.length - b.nodes.length || a.name.localeCompare(b.name));

  for (const p of order) assign(nameKey(p.name), new Set());

  const placed: Placement[] = [];
  for (const [id, key] of matchNode) {
    const p = people.get(key)!;
    const [track, slot] = [id.slice(0, id.indexOf("|")) as TrackKey, id.slice(id.indexOf("|") + 1)];
    placed.push({ track, slot, name: p.name, title: p.title, company: p.company });
  }

  const unplaced: { name: string; track: TrackKey; why: string }[] = [];
  for (const p of [...people.values()].sort((a, b) => a.name.localeCompare(b.name))) {
    if (matchPerson.has(nameKey(p.name))) continue;
    unplaced.push({
      name: p.name,
      track: p.nodes.some((n) => n.startsWith("main")) ? "main" : "demos",
      why: p.nodes.length === 0
        ? "no availability given"
        : "every slot they offered is taken by someone with fewer options",
    });
  }

  return { placed, unplaced };
}

// A slot in the CSVs that ended up with nobody in it, so the report can say so.
function emptySlots(placed: Placement[]): string[] {
  const taken = new Set(placed.map((p) => `${p.track}|${p.slot}`));
  const all = new Set<string>();
  for (const [track, pool] of [["main", main], ["demos", demos]] as [TrackKey, Entry[]][]) {
    for (const e of pool) for (const slot of e.slots) all.add(`${track}|${slot}`);
  }
  return [...all].filter((id) => !taken.has(id)).sort();
}

const { placed, unplaced } = solve();

// ---------- speakers the availability forms missed ----------
// Three people in the deck never filled in an availability form and two left
// theirs blank, so the matching cannot see them at all. They have talks, and a
// draft programme that silently omits five speakers is worse than one that
// puts them in the slots the matching left empty. Whoever the deck labels
// "Keynote:" takes the closing keynote, which the day's structure already
// holds open.
const onProgramme = new Set(placed.map((p) => nameKey(p.name)));
const missing = deck.filter((d) => d.talk_title && !onProgramme.has(nameKey(d.name)));

const keynote = missing.find((d) => /^keynote/i.test(d.talk_title ?? "")) ?? null;
const fillers = missing.filter((d) => d !== keynote);

for (const id of emptySlots(placed)) {
  const d = fillers.shift();
  if (!d) break;
  const [track, slot] = [id.slice(0, id.indexOf("|")) as TrackKey, id.slice(id.indexOf("|") + 1)];
  placed.push({ track, slot, name: d.name, title: d.title, company: d.company });
  onProgramme.add(nameKey(d.name));
}

// Someone can reach here from both lists — in the deck with a talk, and in a
// CSV with no availability — so de-duplicate before reporting.
const stillOff = [
  ...new Set([
    ...fillers.map((d) => d.name),
    ...unplaced.filter((u) => !onProgramme.has(nameKey(u.name))).map((u) => u.name),
  ]),
].sort();

// ---------- the fixed shape of the day ----------
const STRUCTURE: [string, string, string][] = [
  ["Registration, coffee & light breakfast", "08:30", "09:30"],
  ["Morning break", "10:25", "10:50"],
  ["Lunch & networking", "11:45", "12:50"],
  ["Afternoon break", "13:45", "14:10"],
  ["Networking & drinks", "16:15", "17:45"],
];
const KEYNOTE_SLOT = { start: "15:30", end: "16:15" };

// ---------- report ----------
console.log(`slots in the CSVs: ${ALL_SLOTS.map((s) => s.parsed.start).join(", ")}\n`);
for (const track of ["main", "demos"] as TrackKey[]) {
  const rows = placed
    .filter((p) => p.track === track)
    .sort((a, b) => parseSlot(a.slot)!.start.localeCompare(parseSlot(b.slot)!.start));
  console.log(`${track.toUpperCase()} — ${rows.length} sessions`);
  for (const r of rows) {
    const s = parseSlot(r.slot)!;
    const t = talks.get(nameKey(r.name))?.talk_title;
    console.log(
      `  ${s.start}–${s.end}  ${r.name.slice(0, 24).padEnd(26)}` +
        `${(t ?? "— no title in the deck —").slice(0, 44)}`,
    );
  }
  console.log();
}
const gaps = emptySlots(placed);
if (gaps.length) {
  console.log("EMPTY SLOTS (left blank rather than double-booking someone):");
  for (const g of gaps) console.log(`  ${g.replace("|", "  ")}`);
  console.log();
}
console.log("CLOSING KEYNOTE");
console.log(
  `  ${KEYNOTE_SLOT.start}–${KEYNOTE_SLOT.end}  ` +
    (keynote
      ? `${keynote.name.padEnd(26)}${keynote.talk_title}`
      : "— nobody in the deck is marked as the keynote —"),
);
console.log();

if (stillOff.length) {
  console.log(`NOT SCHEDULED: ${stillOff.join(", ")}`);
  console.log("  No availability given and no empty slot left. Place them by hand.");
  console.log();
}

if (!process.argv.includes("--write")) {
  console.log("Preview only. Re-run with --write to replace the programme.");
  process.exit(0);
}

// ---------- write ----------
const ref = process.env.NEXT_PUBLIC_SUPABASE_URL!.match(/https:\/\/([^.]+)\./)![1];
const db = new pg.Client({
  host: "aws-1-eu-west-1.pooler.supabase.com", port: 5432,
  user: `postgres.${ref}`, password: process.env.SUPABASE_DB_PASSWORD,
  database: "postgres", ssl: { rejectUnauthorized: false },
});
await db.connect();

await db.query("delete from public.posts where session_id is not null");
await db.query("delete from public.sessions");

let withTitle = 0;
for (const p of placed) {
  const s = parseSlot(p.slot)!;
  const talk = talks.get(nameKey(p.name));

  // Use the real talk title from the deck. Only where the deck has none does
  // the title say so plainly, rather than inventing one.
  const title = talk?.talk_title ?? "Session — title to be confirmed";
  if (talk?.talk_title) withTitle++;

  await db.query(
    `insert into public.sessions
       (track, title, speaker_name, starts_at, ends_at, room, notes, description)
     values ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [p.track, title, p.name, timeToIso(s.start), timeToIso(s.end),
     roomForTrack(p.track), MARK, talk?.talk_description ?? null],
  );
}

if (keynote) {
  await db.query(
    `insert into public.sessions
       (track, title, speaker_name, starts_at, ends_at, room, notes, description)
     values ('main',$1,$2,$3,$4,$5,$6,$7)`,
    [keynote.talk_title, keynote.name, timeToIso(KEYNOTE_SLOT.start),
     timeToIso(KEYNOTE_SLOT.end), roomForTrack("main"), MARK, keynote.talk_description],
  );
  withTitle++;
}

for (const [title, start, end] of STRUCTURE) {
  await db.query(
    `insert into public.sessions
       (track, title, speaker_name, starts_at, ends_at, room, notes)
     values ('main',$1,null,$2,$3,$4,$5)`,
    [title, timeToIso(start), timeToIso(end), roomForTrack("main"), MARK],
  );
}

const { rows: [t] } = await db.query(
  `select count(*)::int n, count(speaker_name)::int sp from public.sessions`);
console.log(`\nwritten: ${t.n} rows (${t.sp} with a speaker, ${t.n - t.sp} day structure)`);
await db.end();
