/**
 * Turns the supplied assets into one normalised speakers.json:
 *
 *   Assets/AIMC CC speaker overview - Ark1.csv   name, title, org, LinkedIn
 *   Assets/speakers-extracted.txt                bio and talk, one page each
 *   Assets/Speaker Photos/                       headshots
 *
 * Produces Assets/speakers.json for review before anything is imported.
 * Nothing here touches the database.
 *
 *   npx tsx scripts/parse-speakers.mts
 */
import fs from "node:fs";
import path from "node:path";
import { nameKey, titleCaseName } from "../lib/names";

const ASSETS = "Assets";
const HEADER = "AI Meetup Copenhagen Community Conference #1";

type Speaker = {
  name: string;
  title: string | null;
  company: string | null;
  linkedin_url: string | null;
  bio: string | null;
  talk: string | null;
  photo: string | null;
};

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

const csvRows = parseCsv(
  fs
    .readFileSync(path.join(ASSETS, "AIMC CC speaker overview - Ark1.csv"), "utf8")
    .replace(/^﻿/, ""),
);
const head = csvRows[0].map((h) => h.trim());
const col = (name: string) => head.indexOf(name);

const fromCsv = new Map<string, Partial<Speaker>>();
for (const r of csvRows.slice(1)) {
  const raw = (r[col("Your name")] ?? "").trim();
  if (!raw) continue;
  fromCsv.set(nameKey(raw), {
    name: titleCaseName(raw),
    title: (r[col("Your title")] ?? "").trim() || null,
    company: (r[col("Your organization")] ?? "").trim() || null,
    linkedin_url: (r[col("LinkedIn")] ?? "").trim() || null,
  });
}

// ---------- PDF pages ----------
const pages = fs
  .readFileSync(path.join(ASSETS, "speakers-extracted.txt"), "utf8")
  .split(/^===== PAGE \d+ =====$/m)
  .map((p) => p.replace(HEADER, "").trim())
  .filter(Boolean);

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Accepts a line as a title/company header only if it reads like one — short,
 * and not a sentence. Without this, a bio's opening line gets mistaken for a
 * job title ("Lars is CTO of Dreamplan, the FSA-licensed fintech").
 */
function splitHeaderLine(line: string): string[] {
  const clean = line.replace(/,\s*$/, "").trim();
  if (!clean || clean.length > 60) return [];
  if (clean.split(/\s+/).length > 7) return [];
  if (/\b(is|was|has|the|a|an|and)\b/i.test(clean.split(/\s*,\s*/)[0])) return [];
  return clean.split(/\s*,\s*/);
}

const fromPdf = new Map<
  string,
  { bio: string; talk: string | null; title: string | null; company: string | null }
>();
for (const page of pages) {
  const lines = page.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) continue;

  const name = lines[0].split(",")[0].trim();
  if (!name || name.length > 60) continue;

  // Strip the name/title/organisation block using the exact strings from the
  // CSV rather than guessing where the header ends. Guessing broke on speakers
  // whose job title wraps across lines — one bio began "Engineering, Data & AI,
  // ZeroNorth" because half a job title had been read as prose.
  const known = fromCsv.get(nameKey(name));
  let body = lines.join(" ").replace(/\s+/g, " ").trim();

  // Speakers absent from the CSV still carry a title line on their PDF page:
  // "Lars Buur" / "CTO, Dreamplan.io". Read it so they aren't left blank, and
  // so the same string can be stripped out of the bio below.
  let pdfTitle: string | null = null;
  let pdfCompany: string | null = null;
  if (!known) {
    // Two layouts appear in the deck: the header wrapped onto its own line
    // ("Lars Buur" / "CTO, Dreamplan.io"), or all on one ("Lars Buur, CTO,
    // Dreamplan.io"). Reading line 1 blindly picked up a bio sentence.
    const inline = lines[0].split(/\s*,\s*/).slice(1);
    const header =
      inline.length > 0 ? inline : splitHeaderLine(lines[1] ?? "");

    if (header.length > 1) {
      pdfCompany = header[header.length - 1].trim() || null;
      pdfTitle = header.slice(0, -1).join(", ").trim() || null;
    } else if (header.length === 1) {
      pdfTitle = header[0].trim() || null;
    }
  }

  const headerBits = [
    name,
    known?.title ?? pdfTitle ?? "",
    known?.company ?? pdfCompany ?? "",
  ]
    .filter(Boolean)
    .flatMap((x) => [x, ...x.split(/\s*,\s*/)])
    .map((x) => x.trim())
    .filter((x) => x.length > 1)
    .sort((a, b) => b.length - a.length);

  // Repeat until nothing more comes off. A single sorted pass is not enough:
  // the longest bit is usually the job title, but at that point the body still
  // starts with the name, so it fails to match and is never retried.
  for (let pass = 0; pass < headerBits.length + 1; pass++) {
    const before = body;
    for (const bit of headerBits) {
      // Anchored, so a company mentioned mid-sentence in the bio survives.
      body = body.replace(new RegExp("^[\\s,]*" + escapeRe(bit) + "[\\s,]*", "i"), "").trim();
    }
    if (body === before) break;
  }

  if (!body) continue;

  // Some bios read "Arun Prakash is a Risk Manager at ...", where the name is
  // the sentence's subject rather than a header. Stripping it left a dangling
  // "is a Risk Manager ...", so put it back when what follows starts lowercase.
  if (/^\p{Ll}/u.test(body)) body = `${name} ${body}`;

  const marker = body.search(/\b(Keynote|Talk|Session|Demo)\s*:/);
  const bio = (marker > 0 ? body.slice(0, marker) : body).trim();
  const talk = marker > 0 ? body.slice(marker).trim() : null;

  if (bio) fromPdf.set(nameKey(name), { bio, talk, title: pdfTitle, company: pdfCompany });
}

// ---------- photos ----------
const photoDir = path.join(ASSETS, "Speaker Photos");
const photos = fs.existsSync(photoDir) ? fs.readdirSync(photoDir) : [];

function findPhoto(name: string): string | null {
  const parts = nameKey(name).split(" ").filter((p) => p.length > 2);
  let best: { file: string; score: number } | null = null;
  for (const file of photos) {
    const stem = nameKey(path.parse(file).name.replace(/[_-]+/g, " "));
    const score = parts.filter((p) => stem.includes(p)).length;
    if (score > 0 && (!best || score > best.score)) best = { file, score };
  }
  return best ? best.file : null;
}

// ---------- combine ----------
const keys = new Set([...fromCsv.keys(), ...fromPdf.keys()]);
const speakers: Speaker[] = [];
for (const key of keys) {
  const c = fromCsv.get(key) ?? {};
  const p = fromPdf.get(key);
  const name = c.name ?? titleCaseName(key);
  speakers.push({
    name,
    title: c.title ?? p?.title ?? null,
    company: c.company ?? p?.company ?? null,
    linkedin_url: c.linkedin_url ?? null,
    bio: p?.bio ?? null,
    talk: p?.talk ?? null,
    photo: findPhoto(name),
  });
}
speakers.sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync(
  path.join(ASSETS, "speakers.json"),
  JSON.stringify(speakers, null, 2) + "\n",
  "utf8",
);

console.log(`${speakers.length} speakers -> Assets/speakers.json\n`);
console.log("NAME                          TITLE  BIO  TALK  PHOTO");
for (const s of speakers) {
  console.log(
    `  ${s.name.slice(0, 27).padEnd(28)} ` +
      `${s.title ? "  y  " : "  -  "} ${s.bio ? " y " : " - "}  ` +
      `${s.talk ? " y  " : " -  "}  ${s.photo ? "y" : "MISSING"}`,
  );
}
const gaps = speakers.filter((s) => !s.bio || !s.photo || !s.title);
if (gaps.length) {
  console.log(`\n${gaps.length} with gaps:`);
  for (const g of gaps) {
    const missing = [!g.title && "title", !g.bio && "bio", !g.photo && "photo"]
      .filter(Boolean)
      .join(", ");
    console.log(`  ${g.name.padEnd(26)} missing ${missing}`);
  }
}
