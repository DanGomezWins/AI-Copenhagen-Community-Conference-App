/**
 * Creates accounts and fully-populated profiles ahead of the event, so nobody
 * has to sign *up* — they sign in and their profile is already there.
 *
 *   npx tsx scripts/import-people.mts            speakers only
 *   npx tsx scripts/import-people.mts --attendees Assets/attendees.csv
 *
 * Idempotent: re-run it as the lists firm up. Matching is on email, falling
 * back to name, so a person imported without an email now gets re-keyed when
 * the real address arrives rather than duplicated.
 *
 * The attendee CSV needs an `email` column. Everything else is optional:
 *   email, first_name, last_name, company, role, is_speaker
 * A single `name` column is split if first/last are absent.
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { nameKey, titleCaseName } from "../lib/names";

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ref = SUPABASE_URL.match(/https:\/\/([^.]+)\./)![1];

const admin = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const db = new pg.Client({
  host: "aws-1-eu-west-1.pooler.supabase.com", port: 5432,
  user: `postgres.${ref}`, password: process.env.SUPABASE_DB_PASSWORD,
  database: "postgres", ssl: { rejectUnauthorized: false },
});
await db.connect();

// Until the checkin.no export arrives, speakers have no email. A placeholder
// keeps them importable and testable; re-running with real addresses re-keys
// them by name rather than creating a second copy.
const PLACEHOLDER_DOMAIN = "placeholder.aimc-cc.test";
const placeholderEmail = (name: string) =>
  `${nameKey(name).replace(/\s+/g, ".")}@${PLACEHOLDER_DOMAIN}`;

type Person = {
  email: string;
  emailIsReal: boolean;
  first_name: string;
  last_name: string;
  company: string | null;
  role: string | null;
  is_speaker: boolean;
  bio: string | null;
  linkedin_url: string | null;
  photo: string | null;
};

function splitName(full: string): [string, string] {
  const parts = titleCaseName(full).split(" ");
  return parts.length === 1 ? [parts[0], ""] : [parts[0], parts.slice(1).join(" ")];
}

// ---------- speakers ----------
const people: Person[] = [];
const speakersPath = "Assets/speakers.json";
if (fs.existsSync(speakersPath)) {
  for (const s of JSON.parse(fs.readFileSync(speakersPath, "utf8"))) {
    const [first, last] = splitName(s.name);
    const email = (s.email ?? "").trim().toLowerCase();
    people.push({
      email: email || placeholderEmail(s.name),
      emailIsReal: Boolean(email),
      first_name: first,
      last_name: last,
      company: s.company ?? null,
      role: s.title ?? null,
      is_speaker: true,
      bio: [s.bio, s.talk].filter(Boolean).join("\n\n") || null,
      linkedin_url: s.linkedin_url ?? null,
      photo: s.photo ?? null,
    });
  }
}

// ---------- attendees ----------
const attArg = process.argv.indexOf("--attendees");
if (attArg !== -1 && process.argv[attArg + 1]) {
  const file = process.argv[attArg + 1];
  const rows = fs.readFileSync(file, "utf8").replace(/^﻿/, "").split("\n")
    .map((l) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, "")))
    .filter((r) => r.some(Boolean));
  const head = rows[0].map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const at = (r: string[], k: string) => {
    const i = head.indexOf(k);
    return i === -1 ? "" : (r[i] ?? "").trim();
  };

  for (const r of rows.slice(1)) {
    const email = at(r, "email").toLowerCase();
    if (!email || !email.includes("@")) continue;
    let first = at(r, "first_name");
    let last = at(r, "last_name");
    if (!first && at(r, "name")) [first, last] = splitName(at(r, "name"));
    if (!first) continue;

    people.push({
      email,
      emailIsReal: true,
      first_name: titleCaseName(first),
      last_name: titleCaseName(last),
      company: at(r, "company") || null,
      role: at(r, "role") || at(r, "title") || null,
      is_speaker: /^(y|yes|true|1|speaker)$/i.test(at(r, "is_speaker")),
      bio: null,
      linkedin_url: at(r, "linkedin") || at(r, "linkedin_url") || null,
      photo: null,
    });
  }
}

if (people.length === 0) {
  console.log("Nothing to import.");
  await db.end();
  process.exit(0);
}

// ---------- import ----------
let created = 0, updated = 0, rekeyed = 0, photos = 0, failed = 0;

for (const p of people) {
  const full = `${p.first_name} ${p.last_name}`.trim();

  try {
    // Find an existing account by email, or by name if this person was
    // imported earlier under a placeholder address.
    let userId: string | null = null;

    const byEmail = await db.query("select id from auth.users where email = $1", [p.email]);
    if (byEmail.rowCount) {
      userId = byEmail.rows[0].id;
    } else if (p.emailIsReal) {
      const byName = await db.query(
        `select pr.id from public.profiles pr
         join auth.users u on u.id = pr.id
         where lower(pr.first_name || ' ' || pr.last_name) = lower($1)
           and u.email like '%@' || $2`,
        [full, PLACEHOLDER_DOMAIN],
      );
      if (byName.rowCount) {
        userId = byName.rows[0].id;
        await db.query("update auth.users set email = $2, updated_at = now() where id = $1",
          [userId, p.email]);
        rekeyed++;
      }
    }

    if (!userId) {
      const { data, error } = await admin.auth.admin.createUser({
        email: p.email,
        email_confirm: true,
      });
      if (error || !data.user) throw new Error(error?.message ?? "createUser failed");
      userId = data.user.id;
      created++;
    } else {
      updated++;
    }

    // Photo first, so the profile row carries its URL from the outset.
    let photoUrl: string | null = null;
    if (p.photo) {
      const src = path.join("Assets", "Speaker Photos", p.photo);
      if (fs.existsSync(src)) {
        // Press photos arrive at up to 7 MB, which is over the bucket limit and
        // absurd for something rendered at 44px in a list. Everything is
        // normalised to a 512px square JPEG — the whole set drops from 36 MB to
        // about a megabyte, which matters on venue wifi.
        const jpeg = await sharp(fs.readFileSync(src))
          .rotate() // honour EXIF orientation before cropping
          .resize(512, 512, { fit: "cover", position: "attention" })
          .jpeg({ quality: 82 })
          .toBuffer();

        const objectPath = `${userId}/avatar.jpg`;
        const { error: upErr } = await admin.storage
          .from("avatars")
          .upload(objectPath, jpeg, { contentType: "image/jpeg", upsert: true });
        if (!upErr) {
          photoUrl = `${admin.storage.from("avatars").getPublicUrl(objectPath).data.publicUrl}?v=${Date.now()}`;
          photos++;
        }
      }
    }

    await db.query(
      `insert into public.profiles
         (id, first_name, last_name, is_speaker, company, role, bio, linkedin_url,
          photo_url, is_prefilled)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)
       on conflict (id) do update set
         first_name   = excluded.first_name,
         last_name    = excluded.last_name,
         is_speaker   = excluded.is_speaker,
         company      = coalesce(excluded.company, public.profiles.company),
         role         = coalesce(excluded.role, public.profiles.role),
         bio          = coalesce(excluded.bio, public.profiles.bio),
         linkedin_url = coalesce(excluded.linkedin_url, public.profiles.linkedin_url),
         photo_url    = coalesce(excluded.photo_url, public.profiles.photo_url),
         is_prefilled = true`,
      [userId, p.first_name, p.last_name, p.is_speaker, p.company, p.role,
       p.bio, p.linkedin_url, photoUrl],
    );
  } catch (err) {
    failed++;
    console.log(`  FAILED ${full}: ${err instanceof Error ? err.message : err}`);
  }
}

const { rows: [t] } = await db.query(
  `select count(*)::int n,
          count(*) filter (where is_speaker)::int sp,
          count(*) filter (where photo_url is not null)::int ph
   from public.profiles`);
const { rows: [ph] } = await db.query(
  "select count(*)::int n from auth.users where email like '%@' || $1", [PLACEHOLDER_DOMAIN]);

console.log(`\naccounts created ${created}, updated ${updated}, re-keyed ${rekeyed}`);
console.log(`photos uploaded  ${photos}`);
if (failed) console.log(`FAILED           ${failed}`);
console.log(`\nprofiles: ${t.n} total, ${t.sp} speakers, ${t.ph} with a photo`);
if (ph.n) {
  console.log(
    `\n${ph.n} still on placeholder addresses — re-run with --attendees once the\n` +
    `real export arrives and they will be re-keyed by name, not duplicated.`);
}
await db.end();
