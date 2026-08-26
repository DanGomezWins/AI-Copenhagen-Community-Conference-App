import fs from "node:fs";
import pg from "pg";
const env = Object.fromEntries(fs.readFileSync(".env.local","utf8").split("\n")
  .map(l=>l.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)).filter(Boolean).map(m=>[m[1],m[2]]));
const ref = env.NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/([^.]+)\./)[1];
const c = new pg.Client({host:`aws-1-eu-west-1.pooler.supabase.com`,port:5432,
  user:`postgres.${ref}`,password:env.SUPABASE_DB_PASSWORD,database:"postgres",
  ssl:{rejectUnauthorized:false}});
await c.connect();

// Seed the organiser allowlist.
await c.query(`insert into public.organisers (email, note) values ($1,$2)
               on conflict (email) do nothing`,
  ["dangomezwindshuttle@gmail.com", "Builder / admin"]);

const tables = await c.query(`
  select c.relname as table,
         c.relrowsecurity as rls,
         (select count(*) from pg_policies p
           where p.schemaname='public' and p.tablename=c.relname) as policies
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind='r' order by c.relname`);
console.log("TABLE                  RLS    POLICIES");
for (const r of tables.rows)
  console.log(`${r.table.padEnd(22)} ${(r.rls?"on":"OFF").padEnd(6)} ${r.policies}`);

const buckets = await c.query("select id, public from storage.buckets order by id");
console.log("\nBUCKETS:", buckets.rows.map(b=>`${b.id}(${b.public?"public":"private"})`).join(", "));

const rt = await c.query(`select tablename from pg_publication_tables
  where pubname='supabase_realtime' and schemaname='public' order by tablename`);
console.log("REALTIME:", rt.rows.map(r=>r.tablename).join(", ") || "(none)");

const org = await c.query("select email from public.organisers");
console.log("ORGANISERS:", org.rows.map(r=>r.email).join(", "));

const fn = await c.query(`select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' order by proname`);
console.log("FUNCTIONS:", fn.rows.map(r=>r.proname).join(", "));
await c.end();
