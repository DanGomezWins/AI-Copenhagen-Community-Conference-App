# AIC Info — Build Plan

**Event:** AI Meetup Copenhagen Community Conference #1
**Date:** Thursday 10 September 2026, 08:30–17:45 CEST
**Venue:** twoday København, Sundkaj 125, 2150 København (Nordhavn)
**Tracks:** Main stage · Demos · Open sessions
**Organiser:** Martin Schultz / Transmission Learning ApS
**Days to launch:** ~15 (plan written 26 Aug 2026)

---

## 0. STATUS — updated 26 Aug 2026

**Stage: Phases 1–5 complete. All features built.**
Still day 1 of 15; the build was budgeted through day 13. What remains is real
data, real-device testing, and the two things blocked on you (Resend, and the
programme/attendee exports).

**Live:** https://aic-info-production.up.railway.app
**Repo:** https://github.com/DanGomezWins/AIC-Info (private, auto-deploys from `main`)

### Phase progress

| Phase | Days | What | Status |
|---|---|---|---|
| 1 | 1–2 | Foundation — deploy, schema, auth, PWA shell | ✅ **Done** |
| 2 | 3–5 | Feed + Program + manual schedule admin | ✅ **Done** |
| 3 | 6–8 | Networking directory + photo upload | ✅ **Done** |
| 4 | 9–11 | Photo → OCR → draft → publish agent | ✅ **Done** |
| 5 | 12–13 | Web push + auto-announcement scheduler | ✅ **Done** |
| 6 | 14 | Seed real data + device testing + dry run | 🔵 **Next** — blocked on the real programme and attendee list |
| 7 | 15 | Buffer / launch | ⬜ Not started |

### Done

- **Infrastructure** — Railway (EU West) auto-deploying from GitHub; Supabase (EU West,
  Ireland); both regions confirmed for GDPR data residency.
- **App shell** — Next.js 16, Tailwind v4, three-tab bottom nav, PWA manifest, service
  worker, generated icons. Installs to a phone home screen.
- **Database** — 8 tables, RLS enabled on every one, 2 storage buckets, realtime on
  `posts` and `sessions`. Applied via a versioned migration runner (`npm run migrate`),
  not dashboard clicks, so the schema is reproducible and in git.
- **Auth** — magic-link sign-in, route gating, deep-link preservation through login,
  first-run routing to profile setup.
- **Profiles** — create and edit, with prefill from the attendee allowlist. Verified
  working end to end: a real profile row exists, written under RLS by its owner.
- **Health endpoint** — `/api/health` reports configuration presence without exposing
  values.

### Not done

Every feature in the brief is built. What remains is data and rehearsal:

- ~~Feed: realtime updates, organiser posting~~ ✅ built
- ~~Program: three-track schedule~~ ✅ built — session **detail** view still outstanding *(Phase 2)*

### Known temporary state

- **Email sign-in is bypassed.** Supabase's built-in SMTP allows only a couple of
  messages per hour, which blocked testing. `/dev/signin` mints a *real* session
  (real user, real cookies, real RLS) without sending mail. Gated by the server-only
  runtime variable `ENABLE_DEV_SIGNIN`; clearing it disables the bypass instantly with
  no rebuild. **Must be removed before the event.**
- **Icons are placeholders** — a generated blue ring on dark. Awaiting brand assets.
- **15 dummy attendee profiles** seeded by `npm run seed:people`, all on
  `@dummy.aicinfo.test` addresses. `node scripts/seed-people.mjs --clear` removes exactly
  those and cascades their profiles away.
- **The programme is dummy data.** 25 fictional speaker sessions plus the real day
  structure, seeded by `npm run seed:program`. Every row is tagged `notes='DUMMY'`, so
  `node scripts/seed-program.mjs --clear` removes exactly those rows and nothing else.
  Speaker names are invented deliberately: the 15 real speakers are public but their
  topics are not announced, and attaching invented talk titles to real, identifiable
  people is not something to leave sitting in a database.

### Waiting on you

| #   | Item                                                         | Blocks                                | Needed by                    |
| --- | ------------------------------------------------------------ | ------------------------------------- | ---------------------------- |
| 1   | **Resend approval + setup**                                  | Real sign-in for ~200 attendees       | Before launch — hard blocker |
| 2   | **Program data** (25 sessions: title, speaker, time, room)   | Program tab having real content       | Day 14, sooner is better     |
| 3   | **Attendee list** (email, name, company, role, speaker flag) | Login allowlist + profile prefill     | Day 14                       |
| 4   | **Logo / brand colours**                                     | Replacing placeholder icons and theme | Optional                     |

Nothing on this list blocks Phase 2 or 3.

---

## 1. Decisions locked

| Decision | Choice |
|---|---|
| Stack | Next.js 16 (App Router, TypeScript, Tailwind v4) + Supabase + **Railway** |
| PWA | Hand-rolled manifest + service worker (needed anyway for push) |
| Auth | Supabase email magic link |
| Schedule updates | Photo → OCR agent → draft → NL correction → approve → publish **(v1 scope)** |
| Notifications | In-app realtime feed **+ web push** |
| AI model | `claude-opus-5` (vision + structured outputs + adaptive thinking) |

### Why this stack

**Railway hosts the app** (replacing Vercel — decided 26 Aug):

1. **Vercel Hobby is non-commercial only.** Vercel's own docs: *"the Hobby plan restricts
   users to non-commercial, personal use only."* This is a ticketed conference (DKK 400–600)
   run by a company. The Vercel path was really $20/mo for Pro. Railway Hobby has no
   equivalent restriction.
2. **Already paid for.** Hobby is $5/mo and includes $5/mo of usage credit.
3. **EU region.** Railway Hobby includes global regions. Deploying to EU West gives
   Copenhagen attendees single-digit-ms latency, and keeps attendee personal data (names,
   employers, emails, photos, LinkedIn URLs) in the EU — the right GDPR posture for a Danish
   event.
4. **Persistent container.** Enables an in-process scheduler for auto-announcements
   (see §7) that Vercel Hobby's 2-cron-jobs-per-day cap ruled out.

**Cost:** memory dominates at $0.00000386/GB/sec — a constant 0.5 GB for a 30-day month is
$5.00. Next.js idling at ~350–400 MB ≈ **$3.50–4/mo**. CPU bills only when *active*, which
at ~200 users on a single day is rounding error. Fits inside the $5 credit: **$0 incremental.**

**Supabase stays** for the data layer. Railway gives compute plus a Postgres container; it
does not give magic-link auth, Realtime, or storage with row-level security. Rebuilding
those means an SMTP provider, a token flow, a WebSocket layer, and signed-URL handling —
roughly 3–4 days out of 15. Bad trade. Supabase free tier, **EU region**, a few ms from
Railway EU.

**Two operational notes:** Railway's app-sleeping must be **off** for launch day. Supabase
free-tier projects pause after 7 days of inactivity — irrelevant during the build, worth
knowing after the event.

---

## 2. Risk note (read this bit)

Two items in scope are the ones that can go wrong on the day:

1. **The OCR agent.** It's the most complex piece and it depends on a photo of a whiteboard
   taken in a busy room. **Mitigation: we build the plain manual schedule editor first**
   (Phase 2), and it stays in the app permanently. If OCR misreads something on the day, the
   organiser edits a session in ~10 seconds by hand. The OCR flow becomes the fast path, not
   the only path.
2. **iOS web push.** Works only when the user has added the PWA to their home screen *and*
   granted permission. Coverage will be partial and uneven, and that is an iOS constraint,
   not something we can engineer around. **Mitigation:** the in-app feed is the source of
   truth and always works; push is an accelerant. We'll also add a short "Add to Home Screen"
   explainer screen so we maximise the install rate.

Neither of these blocks the build. Both are worth knowing before launch day.

---

## 3. Data model (Postgres / Supabase)

*Verified against the live database 26 Aug 2026. Applied by
`supabase/migrations/0001`–`0004`; run `npm run db:verify` to re-check.*

```
profiles                          -- opt-in; created by the attendee, never for them
  id                 uuid PK  → auth.users.id  (cascade delete)
  first_name         text                   -- checked non-blank
  last_name          text                   -- checked non-blank
  is_speaker         bool                   -- the Speaker/Guest radio
  company            text  null
  role               text  null
  linkedin_url       text  null
  public_email       text  null   -- shown to attendees; separate from login email
  photo_url          text  null   -- Supabase Storage, avatars bucket
  created_at, updated_at

sessions                          -- the program, all three tracks
  id                 uuid PK
  track              track_t enum('main','demos','open')
  title              text
  speaker_name       text  null   -- free text; most speakers have no app profile
  speaker_profile_id uuid  null → profiles.id     -- linked when they do
  starts_at          timestamptz
  ends_at            timestamptz null            -- checked > starts_at
  room               text  null
  status             session_status_t enum('scheduled','cancelled')
  notes              text  null
  announced_at       timestamptz null  -- auto-announcer stamp; cleared on reschedule
  created_at, updated_at

posts                             -- the feed
  id                 uuid PK
  body               text                   -- checked non-blank
  kind               post_kind_t enum('info','alert','schedule_change','auto')
  author_id          uuid  null → profiles.id   -- null for scheduler-generated posts
  session_id         uuid  null → sessions.id   -- set when a post is about a session
  created_at

schedule_drafts                   -- OCR agent working state
  id                 uuid PK
  photo_url          text
  status             draft_status_t enum('processing','review','published','discarded')
  track              track_t                -- defaults to 'open'
  proposed           jsonb                  -- proposed session rows
  conversation       jsonb                  -- NL correction turns, for refine context
  error              text  null
  created_by         uuid  null → profiles.id
  created_at, published_at

attendee_allowlist                -- from the checkin.no export
  email              text PK                -- the join key
  first_name, last_name, company, role   text null
  is_speaker         bool
  created_at

push_subscriptions
  id                 uuid PK
  profile_id         uuid → profiles.id  (cascade delete)
  endpoint           text UNIQUE
  keys               jsonb
  created_at

organisers                        -- admin allowlist
  email              text PK
  note               text null
  created_at

app_settings                      -- single row, enforced by a check constraint
  id                 bool PK  (always true)
  auto_announce      bool                   -- the scheduler kill switch
  updated_at

_migrations                       -- migration ledger; RLS-locked, not app data
  filename           text PK
  applied_at
```

### Row Level Security

RLS is enabled on **every** table above. Current policy set:

| Table | Read | Write |
|---|---|---|
| `profiles` | any authenticated user | owner only (`auth.uid() = id`); organisers may also delete |
| `sessions` | any authenticated user | organisers only |
| `posts` | any authenticated user | organisers only |
| `app_settings` | any authenticated user | organisers only |
| `organisers` | any authenticated user | service role only (no write policy) |
| `schedule_drafts` | organisers only | organisers only |
| `push_subscriptions` | own rows only | own rows only |
| `attendee_allowlist` | **organisers only** | service role only |
| `_migrations` | nobody | nobody (direct connection only) |

`attendee_allowlist` is deliberately not readable by ordinary attendees: it holds
personal data for people who have **not** opted into the directory. Only the service
role touches it, during sign-in gating and profile prefill.

`is_organiser()` is a `SECURITY DEFINER` function comparing the caller's JWT email
against `organisers`. It must be definer-rights, or every policy that calls it would
fail against its own RLS.

### Storage buckets

| Bucket | Public | Limit | Write access |
|---|---|---|---|
| `avatars` | yes — they appear in the directory | 5 MB | owner only, folder scoped to their uid |
| `scans` | no | 20 MB | organisers only |

### Realtime

Enabled on `posts` and `sessions` — driving the live feed and the program's
"happening now" state.

---

## 4. App structure

Bottom tab bar, three tabs, matching the brief exactly.
**Status column reflects what is actually built.**

| Route | What it is | Status |
|---|---|---|
| `/` | **Feed** — organiser updates, newest first, live via Realtime, "N new" banner | ✅ built |
| `/program` | **Program** — segmented control: Main stage / Demos / Open sessions. Time-ordered, now/next highlighting, day structure inline | ✅ built (dummy data) |
| `/people` | **Networking** — directory. A–Z sort, Speaker/Guest filter, instant search across name + company + role, with Nordic character folding | ✅ built |
| `/people/[id]` | Profile detail — photo, name, company, role, LinkedIn, email, and their sessions | ✅ built |
| `/me` | Create / edit my own profile | ✅ built |
| `/login` | Magic-link sign-in | ✅ built |
| `/auth/callback` | Redeems the magic link, routes first-timers to profile setup | ✅ built |
| `/api/health` | Config presence check, no values exposed. Railway healthcheck target | ✅ built |
| `/dev/signin` | **Temporary** email-free sign-in — see §0 | ⚠️ built, must be removed |

Organiser-only — none built yet:

| Route | What it is | Status |
|---|---|---|
| `/admin` | Hub, including the auto-announce kill switch. 404s for non-organisers so the area isn't advertised | ✅ built |
| `/admin/post` | Free-text update with optional track tag and an alert flag. Edit and delete after posting. Presets dropped by decision 26 Aug — the auto-announcer covers the scheduled cases, so manual posts are inherently the unplanned ones. | ✅ built |
| `/admin/organisers` | Add/remove organisers by email. Self-removal blocked. | ✅ built |
| `/admin/schedule` | Add / edit / cancel / restore any session in any track. Auto-posts a change notice, but only when the time or room actually moved. The always-works fallback if OCR misfires. | ✅ built |
| `/admin/scan` | Photo → `claude-opus-5` vision → colour-coded diff → plain-English correction → publish | ✅ built |

---


## 5. The OCR schedule agent

```
1. CAPTURE   /admin/scan
             <input type="file" accept="image/*" capture="environment">
             → uploads straight to Supabase Storage

2. EXTRACT   POST /api/scan
             → claude-opus-5, image + the CURRENT open-sessions schedule as context
             → structured output (output_config.format) forces the shape:
               { sessions: [{ title, speaker_name, starts_at, room, confidence }] }
             → saved as a schedule_draft with status='review'

3. REVIEW    Rendered as a DIFF against what's live, not a wall of text:
               green  = new session
               amber  = changed (shows before → after)
               red    = removed
             Low-confidence fields are flagged for the editor's eye.

4. CORRECT   Editor types plain English: "the 14:20 one is in Room 2, not Room 3"
             → POST /api/scan/refine with the draft + conversation history
             → Claude returns a revised draft → back to step 3. Repeats as needed.

5. PUBLISH   → writes rows to `sessions`
             → auto-composes a feed post ("Open Sessions schedule updated")
             → fires web push
             → marks the draft published
```

**Cost:** one photo ≈ 2K input + 1K output tokens on `claude-opus-5` ($5/$25 per MTok)
≈ **$0.03 per scan**. Fifty scans on the day is about a dollar and a half. Not a factor.

---

## 6. Web push

- VAPID keypair in env; `web-push` on the server.
- Service worker handles `push` and `notificationclick` (deep-links to the feed).
- Permission is requested **after** the user completes their profile, not on first load —
  materially better grant rates than prompting a cold visitor.
- An "Add to Home Screen" explainer screen, shown to iOS users, since push depends on it.
- Every organiser post triggers a push to all subscribers.

---

## 7. Timeline

| Days | Phase | Output | Status |
|---|---|---|---|
| 1–2 | **Foundation** | Next.js + Supabase + Railway wired up (both EU region), schema + RLS live, magic-link auth working, PWA shell installs to home screen. **Live URL exists at the end of day 2.** | ✅ done day 1 |
| 3–5 | **Feed + Program** | Feed with realtime; organiser posting; three-track program; manual schedule admin (the fallback) | ✅ done day 1 |
| 6–8 | **Networking** | Profile create/edit, photo upload, directory with sort/filter/search, profile detail | ✅ done day 1 |
| 9–11 | **OCR agent** | Capture → extract → diff review → NL correction → publish | ✅ done day 1 |
| 12–13 | **Push + auto-announcer** | VAPID, service worker, subscription flow, install explainer; `node-cron` scheduler with duplicate protection and kill switch | ✅ done day 1 |
| 14 | **Seed + rehearse** | Real program data loaded; test on real iOS + Android; dry run with Martin | ⬜ |
| 15 | **Buffer** | Slack for whatever breaks. Launch. | ⬜ |

The ordering is deliberate: **the app is useful and shippable from the end of day 5.**
Everything after that improves it. If we lose days somewhere, we cut from the back, not
the front.

### Auto-announcement scheduler — IN SCOPE (confirmed 26 Aug)

Railway runs a persistent container, so an in-process scheduler (`node-cron`) ticks every
minute, reads upcoming sessions, and auto-posts to the feed with zero organiser action:

- **"Next up: [title] — [speaker], [room], in 5 minutes"** before each session
- **Break and lunch markers** from the fixed day structure (08:30 registration, 11:50 lunch,
  15:30 final keynote, 16:15 networking)

**Duplicate protection:** each session carries `announced_at`; the scheduler only posts
where it's null, then stamps it. A restart, a redeploy, or a schedule edit therefore can't
double-post. Auto-posts are written with `kind='auto'` so the feed can style them
differently from a human organiser update, and so they're easy to audit afterwards.

**Interaction with live edits:** if the OCR flow or a manual edit changes a session's time,
`announced_at` resets to null — so a rescheduled session gets a fresh, correct announcement
rather than being silently skipped.

**Manual posting is deliberately free-text only** (decided 26 Aug). The auto-announcer
handles everything schedule-derived, so what an organiser types by hand is by definition
the unplanned stuff — wifi passwords, a speaker stuck in traffic, lunch being ready. One
carve-out: **time and room changes go through the schedule editor, not the feed**, because
a free-text "moved to Room 3" would leave the Program tab and the announcer both stating
the old room. The editor changes the session and posts the notice in one action.

**Kill switch:** a single toggle at `/admin` disables all auto-posting instantly. If the day
runs late and the schedule drifts, Martin turns it off rather than having the app confidently
announce sessions that aren't happening. This matters more than it sounds — a schedule-driven
announcer is only as right as the schedule.

Half a day, lands in days 12–13 alongside push.

---

## 8. Setup & credentials — all resolved

> **All credentials live in `.env.local`, gitignored. Never paste a secret into
> PLAN.md or any tracked file.** `railway-vars.txt` (also gitignored) holds the
> same values formatted for Railway's raw variable editor.

Everything that was blocking day 1 is done:

| #   | Item                                    | Status                                                                                                                                                                                                       |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Supabase** project, EU West (Ireland) | ✅ `shggwtoeppiwyybkanfc`. Both keys in `.env.local` and Railway; verified with live API calls.                                                                                                               |
| 2   | **GitHub repo**                         | ✅ [DanGomezWins/AIC-Info](https://github.com/DanGomezWins/AIC-Info), private.                                                                                                                                |
| 3   | **Railway** project, EU West            | ✅ Live at https://aic-info-production.up.railway.app, auto-deploying from `main`.                                                                                                                            |
| 4   | **Anthropic API key**                   | ✅ In place and verified. *Not rotated — your decision, 26 Aug. The key was written to PLAN.md in plaintext but never reached GitHub (the repo held only README.md at the time), so exposure was local only.* |
| 5   | **Organiser allowlist**                 | ✅ `dangomezwindshuttle@gmail.com` seeded. Martin's is one row, addable any time including on the day.                                                                                                        |
| 6   | **Supabase redirect URLs**              | ✅ Site URL and both redirect entries configured.                                                                                                                                                             |
|     |                                         |                                                                                                                                                                                                              |

### Environment variables

Set in `.env.local` **and** Railway → Variables:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser client; RLS does the protecting |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only. Bypasses RLS. |
| `SUPABASE_DB_PASSWORD` | Local migrations only; not needed by the app |
| `ANTHROPIC_API_KEY` | OCR agent (Phase 4) |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for redirects behind Railway's proxy |
| `ENABLE_DEV_SIGNIN` | **Temporary.** Server-only, runtime-read security gate. Delete to kill the email bypass instantly. |
| `NEXT_PUBLIC_ENABLE_DEV_SIGNIN` | **Temporary.** Build-time; only swaps the login button. Never the security gate. |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web push — generated in Phase 5 |

### Still outstanding

| # | Item | Blocks | Needed by |
|---|---|---|---|
| 1 | **Resend** — approval, then SMTP setup in Supabase | Real sign-in for ~200 attendees | **Before launch — hard blocker** |
| 2 | **Program data** — 25 sessions: title, speaker, time, room | Replacing the dummy programme with the real one | Day 14; sooner is better |
| 3 | **Attendee list** — email (join key), first/last name, company, job title, speaker flag | Login allowlist + profile prefill | Day 14 |
| 4 | **Logo / brand colours** | Replacing the placeholder icons and theme | Optional |

Importer formats for 2 and 3 will be built to match whatever you have — CSV,
spreadsheet, or pasted text. Don't reformat anything on my account.

### On the domain — settled

`aic-info-production.up.railway.app`. Decided 26 Aug: no custom domain.

---

## 9. Assumptions I've made

- **The attendee list is an allowlist + prefill, not a profile import.** The checkin.no
  export gates who can sign in (ticket holders only) and pre-fills name/company/role when
  someone logs in with a matching email — so creating a profile takes about five seconds
  instead of a minute. It does **not** silently create public profiles.
- **The directory stays opt-in** — a profile becomes visible only when the attendee saves
  it. Since the directory publishes names, employers, and LinkedIn URLs to a few hundred
  strangers, opt-in is the correct posture under GDPR and the honest one for attendees.
  Unmatched emails aren't hard-blocked; they get a "we couldn't find your ticket" path so
  a last-minute or transferred ticket doesn't lock someone out on the day.
- **Main stage and Demos are edited manually**; only Open sessions gets the photo/OCR flow,
  since that's the track being decided live on the day. The OCR flow can be pointed at the
  other tracks later if wanted.
- **Danish/English:** English only. Everything on the Meetup and registration pages is English.
- **One event.** No multi-event support, no year-over-year reuse. If AIC #2 happens we
  revisit; building for it now would cost days we don't have.

---

## 10. Open decisions

**Should the Feed and Program be readable without signing in?**
Currently everything requires a login. My recommendation is that the Feed and Program
should be public — they hold nothing personal beyond speaker names and talk titles,
which are already published on Meetup and the registration site — with sign-in required
only for the Networking directory and profile creation.

The argument is launch-day resilience: if email delivery misbehaves on the morning of
the 10th, an all-authenticated app is useless to everyone, whereas a public Program and
Feed keep working and only networking degrades. It also removes all friction from the
most common action, which is someone glancing at what is on next.

Raised 26 Aug; you set it aside pending the Resend decision. Cheap to change either way
until Phase 3 is finished — after that the directory's auth boundary is load-bearing.
