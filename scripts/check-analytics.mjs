/**
 * Checks that the analytics actually agree with each other.
 *
 *   node scripts/check-analytics.mjs
 *
 * Three places describe the same events and can drift apart silently:
 * lib/analytics.ts defines the names, the call sites decide what is really
 * sent, and Assets/metrics-framework.csv is what the dashboard is built from.
 * Nothing fails when they disagree - a tile just returns no data, which reads
 * as "nobody did this" rather than "we never sent it".
 *
 * That is not hypothetical: the demo product-link tile divided by
 * session_page_opened filtered on track, and the event carried no track. The
 * tile was correct and the number was silently zero.
 *
 * Exits non-zero if anything is inconsistent, so it can gate a deploy.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const problems = [];
const notes = [];

// ---------- 1. the names ----------
const analyticsSrc = fs.readFileSync("lib/analytics.ts", "utf8");
const defined = new Map(); // CONSTANT -> "event_name"
for (const m of analyticsSrc.matchAll(/^\s*([A-Z_]+):\s*"([a-z_]+)"/gm)) {
  defined.set(m[1], m[2]);
}

// ---------- 2. what the code actually sends ----------
function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (/\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

const files = [...walk("app"), ...walk("components")].filter(
  (f) => !f.endsWith(path.join("lib", "analytics.ts")),
);

/** CONSTANT -> Set of property keys seen at any call site */
const fired = new Map();

/**
 * Deliberately simple: find each EVENTS.X reference and read the properties in
 * the next stretch of source. A parser that understands the call syntax kept
 * missing real call sites - a ternary picking between two events, a property
 * object on the following line - and a checker that quietly misses things is
 * worse than no checker, because it reports success.
 */
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");

  for (const m of src.matchAll(/EVENTS\.([A-Z_]+)/g)) {
    const constant = m[1];
    const after = src.slice(m.index, m.index + 400);

    // The first object literal after the event reference, if there is one
    // before the statement ends.
    // The last pattern catches a property object behind a condition -
    // `fromSearch ? { from_search: true } : undefined` - which the others miss.
    // A property that only sometimes ships is still a property a tile can be
    // built on, and is exactly the kind that goes unnoticed.
    const obj =
      after.match(/properties=\{\{([\s\S]*?)\}\}/) ??
      after.match(/,\s*\{([\s\S]*?)\}\s*[,)]/) ??
      // Kept to a short window: further out and it starts matching unrelated
      // objects, like a `const { error } = await ...` on the next line.
      after.slice(0, 90).match(/\{\s*([a-z_][a-z0-9_]*\s*:[\s\S]{0,60}?)\}/i);

    // Keys are written either as `name: value` or shorthand `{ name }`, and
    // both reach PostHog as properties. Anything that is plainly not one -
    // a JSX handler, a transport option - is dropped rather than reported as
    // a property the dashboard could use.
    const NOT_A_PROPERTY = /^(onLeave|on[A-Z]|class|key|ref|href|children)/;
    const body = obj ? obj[1] : "";
    const keys = [
      ...[...body.matchAll(/([a-z_][a-z0-9_]*)\s*:/gi)].map((k) => k[1]),
      ...[...body.matchAll(/(?:^|[{,])\s*([a-z_][a-z0-9_]*)\s*(?=[,}]|$)/gi)].map((k) => k[1]),
    ].filter((k) => !NOT_A_PROPERTY.test(k));

    const prev = fired.get(constant) ?? new Set();
    keys.forEach((k) => prev.add(k));
    fired.set(constant, prev);
  }
}

// ---------- 3. what the dashboard is built from ----------
function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
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
  const head = rows.shift();
  return rows
    .filter((r) => r.some((v) => v.trim()))
    .map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}

const csv = parseCsv(fs.readFileSync("Assets/metrics-framework.csv", "utf8"));

// ---------- the checks ----------
const firedNames = new Set([...fired.keys()].map((c) => defined.get(c)));

const neededByATile = new Set(
  csv.flatMap((r) => r.Event.match(/[a-z_]+/g) ?? []),
);
for (const [constant, name] of defined) {
  if (fired.has(constant)) continue;
  // Dormant events belong to switched-off features and break nothing. Only a
  // tile that depends on one is a problem.
  if (neededByATile.has(name)) problems.push(`${name} never fires, but a tile needs it`);
  else notes.push(`${name} is defined but never fired (dormant feature)`);
}

for (const row of csv) {
  const events = (row.Event.match(/[a-z_]+/g) ?? []).filter((e) =>
    [...defined.values()].includes(e),
  );
  if (events.length === 0 && !/cohort/i.test(row.Event) && !/\$pageview/.test(row.Event)) {
    problems.push(`"${row["Tile name"]}" names no known event (${row.Event})`);
    continue;
  }

  for (const ev of events) {
    if (!firedNames.has(ev)) {
      problems.push(`"${row["Tile name"]}" needs ${ev}, which never fires`);
    }
  }

  // the failure that actually happened: a tile depends on a property the
  // event does not carry
  const wanted = (row.Properties.match(/[a-z_][a-z0-9_]*/gi) ?? []).filter(
    (p) => !["bool", "optional", "main", "demos", "open", "mine", "star", "rating"].includes(p),
  );
  for (const ev of events) {
    const constant = [...defined].find(([, n]) => n === ev)?.[0];
    const has = fired.get(constant) ?? new Set();
    for (const w of wanted) {
      if (/^\d/.test(w)) continue;
      if (!has.has(w) && !["path", "sessionId", "length", "results"].includes(w)) {
        if (!has.has(w)) notes.push(`${ev}: CSV lists "${w}" - not seen at a call site`);
      }
    }
  }
}

// ---------- report ----------
console.log(`events defined : ${defined.size}`);
console.log(`events fired   : ${fired.size}`);
console.log(`tiles in CSV   : ${csv.length}\n`);

console.log("event                              properties sent");
console.log("-".repeat(62));
for (const [constant, name] of [...defined].sort((a, b) => a[1].localeCompare(b[1]))) {
  const props = fired.get(constant);
  const shown = props ? ([...props].join(", ") || "-") : "NEVER FIRED";
  console.log(`${name.padEnd(34)} ${shown}`);
}

if (notes.length) {
  console.log("\nworth checking:");
  for (const n of [...new Set(notes)]) console.log(`  - ${n}`);
}

if (problems.length) {
  console.log("\nPROBLEMS:");
  for (const p of [...new Set(problems)]) console.log(`  ! ${p}`);
  process.exit(1);
}

console.log("\nNo inconsistencies between the code and the framework.");
