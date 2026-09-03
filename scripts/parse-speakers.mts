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
  talk_title: string | null;
  talk_description: string | null;
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

// ---------- PDF (structured, from extract-speakers-pdf.py) ----------
// The deck marks structure by font weight, so the Python extractor reads it
// directly rather than guessing from punctuation. That is what finally
// separated each speaker's talk title and description from their bio.
type PdfEntry = {
  name: string;
  title: string | null;
  company: string | null;
  talk_title: string | null;
  talk_description: string | null;
  bio: string | null;
};

const pdfPath = path.join(ASSETS, "speakers-pdf.json");
if (!fs.existsSync(pdfPath)) {
  console.error(
    "Assets/speakers-pdf.json is missing. " +
      "Run:  python3 scripts/extract-speakers-pdf.py",
  );
  process.exit(1);
}

const fromPdf = new Map<string, PdfEntry>();
for (const e of JSON.parse(fs.readFileSync(pdfPath, "utf8")) as PdfEntry[]) {
  if (e.name) fromPdf.set(nameKey(e.name), e);
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
    talk_title: p?.talk_title ?? null,
    talk_description: p?.talk_description ?? null,
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
console.log("NAME                        TALK TITLE                       BIO PHOTO");
for (const s of speakers) {
  console.log(
    `  ${s.name.slice(0, 25).padEnd(26)} ` +
      `${(s.talk_title ?? "— none —").slice(0, 30).padEnd(32)}` +
      `${s.bio ? " y " : " - "} ${s.photo ? "y" : "MISSING"}`,
  );
}
const gaps = speakers.filter((s) => !s.bio || !s.photo || !s.title || !s.talk_title);
if (gaps.length) {
  console.log(`\n${gaps.length} with gaps:`);
  for (const g of gaps) {
    const missing = [
      !g.title && "title",
      !g.bio && "bio",
      !g.photo && "photo",
      !g.talk_title && "talk title",
    ]
      .filter(Boolean)
      .join(", ");
    console.log(`  ${g.name.padEnd(26)} missing ${missing}`);
  }
}
