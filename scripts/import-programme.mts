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
 *   - speakers with a single available slot are pinned first, since that is
 *     effectively an assignment already
 *   - the rest are filled most-constrained-first, so someone with two options
 *     is placed before someone with eight
 *   - nobody is placed in two rooms at once
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

const main = readAvailability("AIMC CC speaker overview - Speaker program - main.csv");
const demos = readAvailability("AIMC CC speaker overview - All demos program.csv");

// Every distinct slot mentioned anywhere, in time order.
const ALL_SLOTS = [...new Set([...main, ...demos].flatMap((e) => e.slots))]
  .map((s) => ({ raw: s, parsed: parseSlot(s) }))
  .filter((s): s is { raw: string; parsed: { start: string; end: string } } => Boolean(s.parsed))
  .sort((a, b) => a.parsed.start.localeCompare(b.parsed.start));

type Placement = { track: TrackKey; slot: string; name: string; title: string | null; company: string | null };

/**
 * Maximum bipartite matching rather than a greedy pass.
 *
 * Greedy filled the demos room first and consumed slots its people also wanted
 * on the main stage, leaving five speakers off the programme entirely when a
 * valid arrangement existed. Augmenting paths find the best arrangement
 * instead of the first one.
 *
 * Two passes:
 *   1. every speaker gets at most one session, maximising how many get on
 *   2. any slot still empty is offered to someone already placed, so long as
 *      they are not needed elsewhere at that time
 */
type Node = { track: TrackKey; slot: string };

function solve(): {
  placed: Placement[];
  unplaced: { name: string; track: TrackKey; why: string }[];
} {
  const nodes: Node[] = [];
  for (const [track, pool] of [["main", main], ["demos", demos]] as [TrackKey, Entry[]][]) {
    for (const slot of [...new Set(pool.flatMap((e) => e.slots))]) {
      nodes.push({ track, slot });
    }
  }
  const nodeId = (n: Node) => `${n.track}|${n.slot}`;

  // Who can fill each (room, slot).
  const candidates = new Map<string, Entry[]>();
  for (const n of nodes) {
    const pool = n.track === "main" ? main : demos;
    candidates.set(nodeId(n), pool.filter((e) => e.slots.includes(n.slot)));
  }

  const assignedTo = new Map<string, Entry>();          // nodeId -> speaker
  const speakerSlots = new Map<string, Set<string>>();  // speakerKey -> times taken

  const busyAt = (key: string, slot: string) => speakerSlots.get(key)?.has(slot) ?? false;

  /** Classic augmenting path: can this speaker be seated, possibly by moving others? */
  function seat(e: Entry, seen: Set<string>, oncePerSpeaker: boolean): boolean {
    const key = nameKey(e.name);
    for (const n of nodes) {
      const id = nodeId(n);
      if (seen.has(id)) continue;
      if (!e.slots.includes(n.slot)) continue;
      if (n.track === "main" ? !main.includes(e) : !demos.includes(e)) continue;
      if (busyAt(key, n.slot)) continue;
      seen.add(id);

      const sitting = assignedTo.get(id);
      if (!sitting) {
        assignedTo.set(id, e);
        speakerSlots.set(key, (speakerSlots.get(key) ?? new Set()).add(n.slot));
        return true;
      }
      // Try to move whoever is already there somewhere else.
      const otherKey = nameKey(sitting.name);
      speakerSlots.get(otherKey)!.delete(n.slot);
      if (seat(sitting, seen, oncePerSpeaker)) {
        assignedTo.set(id, e);
        speakerSlots.set(key, (speakerSlots.get(key) ?? new Set()).add(n.slot));
        return true;
      }
      speakerSlots.get(otherKey)!.add(n.slot);
    }
    return false;
  }

  // Pass 1 — one session each, most constrained first.
  const everyone = [...new Map([...main, ...demos].map((e) => [nameKey(e.name), e])).values()]
    .sort((a, b) => a.slots.length - b.slots.length);

  const seated = new Set<string>();
  for (const e of everyone) {
    if (e.slots.length === 0) continue;
    if (seat(e, new Set(), true)) seated.add(nameKey(e.name));
  }

  // Pass 2 — fill anything still empty with someone free at that time.
  for (const n of nodes) {
    const id = nodeId(n);
    if (assignedTo.has(id)) continue;
    const pool = candidates.get(id) ?? [];
    const free = pool.find((e) => !busyAt(nameKey(e.name), n.slot));
    if (free) {
      assignedTo.set(id, free);
      speakerSlots.set(nameKey(free.name), (speakerSlots.get(nameKey(free.name)) ?? new Set()).add(n.slot));
    }
  }

  const placed: Placement[] = [];
  for (const n of nodes) {
    const e = assignedTo.get(nodeId(n));
    if (e) placed.push({ track: n.track, slot: n.slot, name: e.name, title: e.title, company: e.company });
  }

  const unplaced: { name: string; track: TrackKey; why: string }[] = [];
  for (const e of everyone) {
    if (seated.has(nameKey(e.name))) continue;
    unplaced.push({
      name: e.name,
      track: main.includes(e) ? "main" : "demos",
      why: e.slots.length === 0 ? "no availability given" : "no free slot among those offered",
    });
  }

  return { placed, unplaced };
}

const { placed, unplaced } = solve();

// ---------- the fixed shape of the day ----------
const STRUCTURE: [string, string, string][] = [
  ["Registration, coffee & light breakfast", "08:30", "09:30"],
  ["Morning break", "10:25", "10:50"],
  ["Lunch & networking", "11:45", "12:50"],
  ["Afternoon break", "13:45", "14:10"],
  ["Final keynote", "15:30", "16:15"],
  ["Networking & drinks", "16:15", "17:45"],
];

// ---------- report ----------
console.log(`slots in the CSVs: ${ALL_SLOTS.map((s) => s.parsed.start).join(", ")}\n`);
for (const track of ["main", "demos"] as TrackKey[]) {
  const rows = placed
    .filter((p) => p.track === track)
    .sort((a, b) => parseSlot(a.slot)!.start.localeCompare(parseSlot(b.slot)!.start));
  console.log(`${track.toUpperCase()} — ${rows.length} sessions`);
  for (const r of rows) {
    const s = parseSlot(r.slot)!;
    console.log(`  ${s.start}–${s.end}  ${r.name}`);
  }
  console.log();
}
if (unplaced.length) {
  console.log("NOT PLACED:");
  for (const u of unplaced) console.log(`  ${u.name.padEnd(26)} (${u.track}) — ${u.why}`);
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

for (const p of placed) {
  const s = parseSlot(p.slot)!;
  // No talk titles exist anywhere in the source material, so the title says so
  // plainly rather than inventing one.
  const title = `Session — title to be confirmed`;
  await db.query(
    `insert into public.sessions
       (track, title, speaker_name, starts_at, ends_at, room, notes)
     values ($1,$2,$3,$4,$5,$6,$7)`,
    [p.track, title, p.name, timeToIso(s.start), timeToIso(s.end),
     roomForTrack(p.track), MARK],
  );
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
