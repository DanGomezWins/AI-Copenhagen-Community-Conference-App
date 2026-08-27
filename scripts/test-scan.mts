/**
 * End-to-end check of the OCR agent against a synthetic whiteboard image.
 * Renders a messy board to PNG, sends it to Claude, prints what came back,
 * then diffs it against the live Open Sessions track.
 *
 *   npx tsx scripts/test-scan.mts
 */
import fs from "node:fs";
import { extractFromPhoto, refineDraft } from "../lib/scan/claude";
import { buildDiff, summarise } from "../lib/scan/diff";
import type { Session } from "../lib/program";

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

/** A deliberately imperfect board: mixed time formats, a crossing-out, shorthand rooms. */
function boardSvg(): string {
  const rows = [
    ["9:30", "AI in Danish Public Sector", "Ida Munk-Jespersen", "R3"],
    ["9.55", "Prompt Eng is Dead", "Gustav Hillerod", "R3"],
    ["10:20", "Hiring for AI Teams", "Signe V. Holm", "R3"],
    ["11:00", "Should We Build This?", "Frederik Aagaard", "R2"],
    ["2:20pm", "Show Us Your Worst Failure", "Nanna Lovgren", "R3"],
    ["3:05pm", "Evals Over Coffee", "Mikkel T.", "R3"],
  ];
  const lines = rows
    .map(
      (r, i) =>
        `<text x="60" y="${170 + i * 78}" font-family="Comic Sans MS, cursive" font-size="30" fill="#1b3a6b">${r[0]}</text>` +
        `<text x="200" y="${170 + i * 78}" font-family="Comic Sans MS, cursive" font-size="30" fill="#1b3a6b">${r[1]}</text>` +
        `<text x="200" y="${203 + i * 78}" font-family="Comic Sans MS, cursive" font-size="23" fill="#4a4a4a">${r[2]} — ${r[3]}</text>`,
    )
    .join("\n");

  // One session struck through, as it would be on a real board.
  const strike = `<line x1="195" y1="${170 + 2 * 78 - 10}" x2="760" y2="${170 + 2 * 78 - 10}" stroke="#b00" stroke-width="4"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700">
    <rect width="1000" height="700" fill="#f7f6f2"/>
    <text x="60" y="90" font-family="Comic Sans MS, cursive" font-size="44" fill="#1b3a6b">OPEN SESSIONS — Thu</text>
    ${lines}
    ${strike}
  </svg>`;
}

const svg = boardSvg();
fs.mkdirSync(".scan-test", { recursive: true });
fs.writeFileSync(".scan-test/board.svg", svg);

// Rasterise via resvg if available, else fall back to sending the SVG as PNG-ish.
let png: Buffer;
try {
  const { Resvg } = await import("@resvg/resvg-js");
  png = new Resvg(svg, { fitTo: { mode: "width", value: 1000 } }).render().asPng();
  fs.writeFileSync(".scan-test/board.png", png);
  console.log(`rendered board.png (${(png.length / 1024).toFixed(0)} KB)\n`);
} catch {
  console.log("resvg not installed — run: npm i -D @resvg/resvg-js");
  process.exit(1);
}

const existing: Session[] = [];

console.log("→ extracting…\n");
const result = await extractFromPhoto(png.toString("base64"), "image/png", existing);

console.log(`unreadable: ${result.unreadable}`);
if (result.remarks) console.log(`remarks: ${result.remarks}`);
console.log(`\n${result.sessions.length} sessions read:`);
for (const s of result.sessions) {
  console.log(
    `  ${s.start_time.padEnd(6)} ${s.title.slice(0, 34).padEnd(36)} ${(s.speaker_name ?? "—").padEnd(22)} ${(s.room ?? "—").padEnd(5)} [${s.confidence}]`,
  );
  if (s.note) console.log(`         note: ${s.note}`);
}

console.log("\n→ applying a plain-English correction…\n");
const revised = await refineDraft(
  result,
  "The 11:00 one ends at 11:25, and the last speaker is Mikkel Thorvaldsen.",
  [],
);
for (const s of revised.sessions) {
  console.log(
    `  ${s.start_time.padEnd(6)} ${s.title.slice(0, 34).padEnd(36)} ${(s.speaker_name ?? "—").padEnd(22)} ${(s.room ?? "—").padEnd(5)} [${s.confidence}]`,
  );
}

const diff = buildDiff(revised.sessions, existing);
console.log("\ndiff vs live:", JSON.stringify(summarise(diff)));
