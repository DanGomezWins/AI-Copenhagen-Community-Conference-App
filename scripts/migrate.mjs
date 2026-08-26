/**
 * Applies supabase/migrations/*.sql in filename order, exactly once each.
 * Tracks applied files in public._migrations.
 *
 *   node scripts/migrate.mjs          apply pending
 *   node scripts/migrate.mjs --status list without applying
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n")
    .map((l) => l.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/))
    .filter(Boolean).map((m) => [m[1], m[2]]),
);

const ref = env.NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/([^.]+)\./)[1];
const password = env.SUPABASE_DB_PASSWORD;
if (!password) throw new Error("SUPABASE_DB_PASSWORD is not set in .env.local");

// Supabase's IPv4 session pooler. Region must match the project's.
const REGION = env.SUPABASE_REGION || "eu-west-1";
const HOSTS = [
  `aws-0-${REGION}.pooler.supabase.com`,
  `aws-1-${REGION}.pooler.supabase.com`,
];

const dir = "supabase/migrations";
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

async function connect() {
  let lastErr;
  for (const host of HOSTS) {
    const client = new pg.Client({
      host,
      port: 5432,
      user: `postgres.${ref}`,
      password,
      database: "postgres",
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });
    try {
      await client.connect();
      console.log(`connected via ${host}`);
      return client;
    } catch (e) {
      lastErr = e;
      console.log(`  ${host} → ${e.message}`);
      try { await client.end(); } catch {}
    }
  }
  throw lastErr;
}

const client = await connect();

await client.query(`
  create table if not exists public._migrations (
    filename   text primary key,
    applied_at timestamptz not null default now()
  );
`);

const { rows } = await client.query("select filename from public._migrations");
const done = new Set(rows.map((r) => r.filename));

if (process.argv.includes("--status")) {
  for (const f of files) console.log(`${done.has(f) ? "✓ applied" : "· pending"}  ${f}`);
  await client.end();
  process.exit(0);
}

let applied = 0;
for (const f of files) {
  if (done.has(f)) { console.log(`✓ ${f} (already applied)`); continue; }
  const sql = fs.readFileSync(path.join(dir, f), "utf8");
  process.stdout.write(`→ ${f} ... `);
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("insert into public._migrations (filename) values ($1)", [f]);
    await client.query("commit");
    console.log("applied");
    applied++;
  } catch (e) {
    await client.query("rollback");
    console.log("FAILED");
    console.error(`\n${e.message}\n`);
    await client.end();
    process.exit(1);
  }
}

console.log(applied ? `\n${applied} migration(s) applied.` : "\nNothing to do — schema up to date.");
await client.end();
