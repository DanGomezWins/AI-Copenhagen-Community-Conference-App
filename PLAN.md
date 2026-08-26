# AIC Info — Build Plan

**Event:** AI Meetup Copenhagen Community Conference #1
**Date:** Thursday 10 September 2026, 08:30–17:45 CEST
**Venue:** twoday København, Sundkaj 125, 2150 København (Nordhavn)
**Tracks:** Main stage · Demos · Open sessions
**Organiser:** Martin Schultz / Transmission Learning ApS
**Days to launch:** ~15 (plan written 26 Aug 2026)

---

## 1. Decisions locked

| Decision | Choice |
|---|---|
| Stack | Next.js 15 (App Router, TypeScript) + Supabase + **Railway** |
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
   (see §7 stretch) that Vercel Hobby's 2-cron-jobs-per-day cap ruled out.

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
   (Phase 3), and it stays in the app permanently. If OCR misreads something on the day, the
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

```
profiles
  id                uuid PK  → auth.users.id
  first_name        text
  last_name         text
  is_speaker        bool         -- the Speaker/Guest radio
  company           text  null
  role              text  null
  linkedin_url      text  null
  public_email      text  null   -- optional, shown on profile; separate from login email
  photo_url         text  null   -- Supabase Storage
  created_at, updated_at

sessions                          -- the program, all three tracks
  id                uuid PK
  track             enum('main','demos','open')
  title             text
  speaker_name      text          -- free text; most speakers won't have an app profile
  speaker_profile_id uuid null → profiles.id     -- linked when they do
  starts_at         timestamptz
  ends_at           timestamptz
  room              text
  status            enum('scheduled','cancelled')
  notes             text null
  announced_at      timestamptz null   -- set by the auto-announcer; reset to null on reschedule
  updated_at

posts                             -- the feed
  id                uuid PK
  body              text
  kind              enum('info','alert','schedule_change','auto')
  author_id         uuid null → profiles.id      -- null for scheduler-generated posts
  created_at

app_settings                      -- single row; runtime toggles
  auto_announce     bool          -- the scheduler kill switch
  updated_at

schedule_drafts                   -- the OCR agent's working state
  id                uuid PK
  photo_url         text
  status            enum('processing','review','published','discarded')
  proposed          jsonb         -- array of proposed session rows
  conversation      jsonb         -- turns of NL correction, for context on refine
  created_by        uuid
  created_at, published_at

push_subscriptions
  id, profile_id, endpoint, keys jsonb, created_at

organisers                        -- admin allowlist
  email             text PK
```

**Row Level Security:** everyone authenticated can read `profiles`, `sessions`, `posts`.
Only the owner can write their own `profiles` row. Only emails in `organisers` can write
`sessions`, `posts`, `schedule_drafts`.

---

## 4. App structure

Bottom tab bar, three tabs, matching the brief exactly:

| Route | What it is |
|---|---|
| `/` | **Feed** — organiser updates, newest first, live via Supabase Realtime, unread badge |
| `/program` | **Program** — segmented control: Main stage / Demos / Open sessions. Time-ordered, "happening now" highlight, tap a session for detail |
| `/people` | **Networking** — attendee directory. A–Z sort, Speaker/Guest filter, free-text search across name + company + role |
| `/people/[id]` | Profile detail — photo, name, company, role, LinkedIn (opens app), email, and their sessions if a speaker |
| `/me` | Edit my own profile |
| `/login` | Magic link |

Organiser-only:

| Route | What it is |
|---|---|
| `/admin` | Hub |
| `/admin/post` | Compose a feed update. **One-tap presets**: "Break in 10 minutes", "Next up: …", "Room change", plus free text. This is the "MUST be easy to publish updates" requirement — target is under 5 seconds from unlock to published. |
| `/admin/schedule` | Manual add/edit/cancel any session in any track — the fallback path |
| `/admin/scan` | The photo → OCR flow |

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

| Days | Phase | Output |
|---|---|---|
| 1–2 | **Foundation** | Next.js + Supabase + Railway wired up (both EU region), schema + RLS live, magic-link auth working, PWA shell installs to home screen. **Live URL exists at the end of day 2.** |
| 3–5 | **Feed + Program** | Feed with realtime; organiser posting with presets; three-track program; manual schedule admin (the fallback) |
| 6–8 | **Networking** | Profile create/edit, photo upload, directory with sort/filter/search, profile detail |
| 9–11 | **OCR agent** | Capture → extract → diff review → NL correction → publish |
| 12–13 | **Push + auto-announcer** | VAPID, service worker, subscription flow, install explainer; `node-cron` scheduler with duplicate protection and kill switch |
| 14 | **Seed + rehearse** | Real program data loaded; test on real iOS + Android; dry run with Martin |
| 15 | **Buffer** | Slack for whatever breaks. Launch. |

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

**Kill switch:** a single toggle at `/admin` disables all auto-posting instantly. If the day
runs late and the schedule drifts, Martin turns it off rather than having the app confidently
announce sessions that aren't happening. This matters more than it sounds — a schedule-driven
announcer is only as right as the schedule.

Half a day, lands in days 12–13 alongside push.

---

## 8. Status of what I need from you

> **All credentials live in `.env.local`, which is gitignored. Never paste a secret into
> PLAN.md or any tracked file.** The same values get pasted into Railway's Variables tab
> for production.

**Blocking — needed on day 1:**

| # | Item | Status |
|---|---|---|
| 1 | **Supabase** project, EU region | 🟡 Project created (`shggwtoeppiwyybkanfc`). Still need the **anon key** and **service role key** — Dashboard → Project Settings → API. |
| 2 | **Railway** project, EU West | 🟡 Needs a GitHub repo first — see below. |
| 3 | **Anthropic API key** | 🔴 **Must be rotated** — the original was written to PLAN.md in plaintext. Revoke at console.anthropic.com → API keys, issue a new one, put it in `.env.local`. |
| 4 | **Organiser emails** | 🟢 `dangomezwindshuttle@gmail.com`. Martin's to be added later — it's one row in the `organisers` table, addable any time, including on the day. |

**Needed by day 14 (seeding):**

| # | Item | Status |
|---|---|---|
| 5 | **Program data** (25 sessions) | 🟡 Coming. Importer will be built format-agnostic — CSV, spreadsheet, or pasted text. |
| 6 | **Attendee list** | 🟡 Coming. Used as a login allowlist + profile prefill, *not* to pre-create public profiles. Fields needed: **email** (the join key — essential), first name, last name, company, job title, and a speaker/attendee flag if the export has one. |
| 7 | **Domain** | 🟡 `aimuccc` chosen. See note below. |
| 8 | **Logo / brand colours** | ⚪ Not yet provided. Will ship with a neutral theme and restyle later if they arrive. |

### On the domain

Railway gives us `<name>.up.railway.app` free, so `aimuccc.up.railway.app` works today at
zero cost. Two things worth weighing: seven letters of acronym is hard to say out loud and
easy to mistype, and it will mostly be reached as a tap-through link from email anyway.

If you want something people can actually repeat to each other, Railway Hobby includes **2
custom domains** — a `.dk` runs about €10/year, and something like `aimc.dk` is far easier
to say at a registration desk than "A-I-M-U-C-C-C". Your call; not a blocker either way, and
we can add a custom domain after launch without changing anything else.

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
