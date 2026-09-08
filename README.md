# AIMC-CC

**A phone app (PWA) for the AI Meetup Copenhagen Community Conference #1 that keeps 200 attendees on the same page: live updates, the full programme with a personal schedule, and a directory so people can find each other. No app store, and no sign-up — profiles are created in advance, so people just sign in.**

🔗 **[aic-info-production.up.railway.app](https://aic-info-production.up.railway.app)**

---

## Contents

- [What it does](#what-it-does)
  - [Feed](#feed-live-updates-from-everyone)
  - [Program & My Schedule](#program--my-schedule)
  - [Session pages](#session-pages)
  - [Networking](#networking)
  - [Organiser tools](#organiser-tools)
  - [Automatic announcements](#automatic-announcements)
  - [Ratings and feedback](#ratings-and-feedback)
- [Getting started](#getting-started)
- [Sign-in and email](#sign-in-and-email)
- [Before the event](#before-the-event)
- [Measuring how it went](#measuring-how-it-went)
- [How it's built](#how-its-built)
  - [Open Sessions API](#open-sessions-the-agenda-arrives-by-api)
  - [Speaker slides are off](#speaker-slides-are-switched-off)
  - [The whiteboard scanner is off](#the-whiteboard-scanner-is-switched-off)
- [Running it locally](#running-it-locally)

---

## What it does

Three tabs, plus an organiser area only organisers can see.

### Feed: live updates from everyone

The home screen. **Anyone can post** — text, a photo, a link. Organisers'
posts are badged and tinted so official information stays separable from
community chatter at a glance.

Posts appear on every phone **instantly**, without anyone refreshing. You can
edit or delete your own; organisers can remove anything. Posts are capped at
500 characters so the feed stays readable on a phone.

Only organiser posts send a notification. Two hundred people each buzzing every
phone is how notifications become the thing everyone switches off by lunchtime.

### Program & My Schedule

**Main stage** and **Demos**, with the day's structure — registration, breaks,
lunch, drinks — laid in. Times are Copenhagen time whatever the phone is set
to. The session happening now is highlighted; finished ones fade back and are
labelled, so the eye lands on what is still to come.

**Tap ☆ on any session** and it joins **My Schedule** — a fourth view showing
everything you've starred across both rooms in one chronological run.

Each card carries the speaker's **role and company**, and each room names its
**moderator** underneath the tabs. The heading and the room tabs stay stuck to
the top as you scroll, so which room you are reading never leaves the screen.

**Open Sessions** are chosen by attendees on the day, on the Open Space board
that runs the proposing and voting. That tab links to the board, and shows an
example schedule until the real one is pushed across &mdash; see
[Open Sessions](#open-sessions-the-agenda-arrives-by-api).

### Session pages

A session can list **more than one speaker** — the closing keynote has three,
and each gets a card. Demo talks carry a link to the product.

Tapping any session opens it: times, room, description, the speaker as a
tappable card, and **Rate this session**.

### Networking

A searchable directory of everyone attending. Filter by speaker or guest,
search by name, company or role, tap through for their professional profile,
LinkedIn and — for speakers — their sessions.

Search handles Danish: `norgaard` finds **Nørgaard**, `odegard` finds
**Ødegård**, and `aagaard` and `agaard` both work.

**Email addresses are not shown on profiles.**

### Organiser tools

Hidden entirely from attendees. An **Organiser** button appears in the top bar
leading to:

| | |
|---|---|
| **Post an update** | Publishes to every phone, badged as official |
| **Edit the schedule** | Add, move, cancel or restore any session; set descriptions and slide links. Moving a time or room posts the notice automatically — fixing a typo doesn't. Warns on a room clash. |
| **Ratings & feedback** | Everything people said, anonymously, in one table |
| **Who can post** | Add or remove organisers by email |
| **Testing tools** | Rehearse announcements and notifications before the day |

### Automatic announcements

The app posts **"Next up: [session] — [speaker]"** five minutes before every
session, on its own, all day. It won't double-post if the server restarts, and
a rescheduled session re-announces at its new time.

**There's an off switch on the organiser screen.** If the day runs late, turn
it off rather than have the app confidently announce sessions that aren't
happening.

### Ratings and feedback

**Rate this app** on the About page, and **Rate this session** on every session
— five stars plus an optional comment. Both are **anonymous**: who left a
rating is never shown and can't be looked up.

---

## Getting started

Five minutes, on your phone.

**1. Open it** → [aic-info-production.up.railway.app](https://aic-info-production.up.railway.app)

**2. Sign in** with your email. A six-digit code arrives; type it in. Your
profile is already there — nothing to fill in.

**3. Add it to your home screen — ideally *before* signing in.** iPhone:
**Share** → **Add to Home Screen**. Android: Chrome offers to install it.

> **What the invitation email should say.** *"Open this link, add it to your
> home screen, then open it from there and sign in."* In that order.
>
> On iPhone a link in an email always opens Safari — Apple has never allowed
> one to open an installed Home Screen app — and the installed app keeps its
> own sign-in, separate from Safari's. Signing in from the icon means doing it
> once, in the place it needs to stick. Sign-in uses a six-digit code precisely
> so nobody has to leave the app to finish. Android is unaffected.

**4. Turn on notifications** — your avatar, top right, below the form.

**5. Walk through it** with [TEST-PLAN.md](TEST-PLAN.md) — a guided tour that
doubles as a checklist, about 25 minutes.

> If you should have organiser access and don't see the **Organiser** button,
> send me your email address and it takes ten seconds.

---

## Sign-in and email

Attendees sign in with a **six-digit code**: enter your email, a code arrives,
type it into the app. No passwords, and no leaving the app.

Mail goes out through **Brevo** (sponsor account, Starter plan, no daily cap)
using Supabase Auth's custom SMTP. Nothing in the app sends email itself, so
changing provider is a dashboard change and touches no code.

**Supabase -> Authentication -> SMTP Settings**

| Field | Value |
| --- | --- |
| Sender email address | `app@aimeetupcopenhagen.dk` |
| Sender name | `AI Meetup Copenhagen` |
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Minimum interval per user | `60` |
| Username | `b54a11001@smtp-brevo.com` |
| Password | the Brevo SMTP key |

**Supabase -> Authentication -> Rate Limits.** The defaults are sized for a
trickle of sign-ups, not 200 people arriving inside an hour, and three of them
count **per IP** - on venue wifi the whole room shares one.

| Limit | Default | Set to |
| --- | --- | --- |
| Sending emails (per hour) | 30 | 500 |
| Sign-ups and sign-ins (per 5 min, per IP) | 30 | 300 |
| Token verifications (per 5 min, per IP) | 30 | 300 |
| Token refreshes (per 5 min, per IP) | 150 | 300 |

Sign-ups and sign-ins bites first: at the default, the thirty-first person to
ask for a code inside five minutes is refused.

Expected volume is about **350 emails on the day** - one code each for 200
attendees, plus resends, second devices and organisers during setup -
concentrated in the 08:30-09:30 registration hour.

**The Magic Link template must contain `{{ .Token }}`** (Authentication ->
Emails -> Magic Link), or the message arrives with no code in it.

**Minimum interval per user is 60 seconds** and the resend button in
[LoginForm](app/login/LoginForm.tsx) matches it. Change one, change the other,
or resending inside the window fails with an unhelpful error.

### DNS on aimeetupcopenhagen.dk

DKIM and DMARC are in place, and **that is enough** - no SPF record is needed.

SPF and DKIM are alternatives for DMARC alignment, not both required: Brevo
signs with the domain's DKIM key, so DMARC passes and Gmail and Yahoo's
bulk-sender rules are satisfied. Brevo's own support confirmed SPF is not
required for domain authentication on their shared IPs.

It would matter if the domain also sent through another service - Google
Workspace, Microsoft 365 - because then that sender would need authorising too.
It does not: the domain has no MX records at all, so nothing else sends or
receives on it. Worth revisiting only if that changes.

One consequence of having no MX: replies to `app@aimeetupcopenhagen.dk` bounce.
Fine for a sign-in code, worth knowing if an invitation goes from that address.

### Test mode

`ENABLE_DEV_SIGNIN=true` signs an address straight in with no email sent, which
is how the app was reviewed before email existed. It is server-only and read at
**runtime**, so clearing it takes effect immediately.
`NEXT_PUBLIC_ENABLE_DEV_SIGNIN` only reveals the button, is inlined at **build**
time so it needs a redeploy, and must never be the security gate.

Both must be `false` in production. Once real sign-in is confirmed, delete
[app/dev/signin/route.ts](app/dev/signin/route.ts) and
[app/api/dev/code/route.ts](app/api/dev/code/route.ts).

> **Why a code and not a link.** Two reasons, and the second is decisive.
>
> A pre-made sign-in link in an email *is* the credential - it can be
> forwarded, screenshotted, or left open on a shared laptop.
>
> More importantly, **a link cannot work on iPhone at all**. Tapping a link in
> Mail opens Safari, and an installed Home Screen app keeps its own sign-in
> separate from Safari's. So an attendee who installs the app, asks to sign in,
> then taps the link in their email ends up signed into *Safari* while the app
> they just installed stays signed out. There is no way to fix that from our
> side.
>
> A code has neither problem. It is typed into whichever copy of the app asked
> for it, so the session lands exactly where the person is - identical on
> iPhone, Android, browser or installed.

---

## Before the event

- [ ] Switch off test-mode sign-in (`ENABLE_DEV_SIGNIN`) and confirm a real code arrives
- [ ] Load the real programme (arriving 24–48h before)
- [ ] Load the attendee list from checkin.no — **this is what I need most**
- [ ] Set `OPEN_SESSIONS_TOKEN` in Railway, and send it with the endpoint spec
- [ ] Point `NEXT_PUBLIC_SITE_URL` at the custom domain, and add it to Supabase's redirect list
- [ ] Add organisers, and the moderators for Main stage and Open sessions
- [ ] Replace the placeholder icon with real branding

**The one thing that blocks everything:** the **attendee export with email
addresses**. Profiles are created in advance from it, and without emails
nothing can be pre-made. The speaker list you sent has no email column.

**Already loaded:** all 18 speakers, with photos, titles, companies, LinkedIn
and bios, taken from the CSV and the speakers PDF. Two gaps in the source
material — **Sofie Hvitved** has no title or bio, **Xander Evangelidis** has no
bio.

---

## Measuring how it went

See **[ANALYTICS.md](ANALYTICS.md)** for complete setup and event tracking details.

Quick summary: **[Assets/metrics-framework.csv](Assets/metrics-framework.csv)** is the HEART framework (Happiness, Engagement, Adoption, Retention, Task Success). Analytics is **[PostHog](https://posthog.com) on EU cloud** — data stays in Frankfurt, no cookie banner needed, and the dashboard is built from 17+ app events that are already instrumented. After you add your PostHog key and redeploy, the app will start sending events and you can build the matching insights on the day after the event.

---

## How it's built

| | |
|---|---|
| **App** | Next.js 16, TypeScript, Tailwind |
| **Data, sign-in, photos** | Supabase — hosted in Ireland |
| **Hosting** | Railway — EU West |
| **Reading the whiteboard** | Claude (`claude-opus-5`) - retired, see below |
| **Analytics** | PostHog — EU cloud |
| **Notifications** | Web push |

**Why a website and not an App Store app:** no download, no review process, no
updates to install. Attendees open a link and save it to their home screen,
where it behaves like an app.

**On data.** Everything is in the EU. Profiles show no email addresses. People
can remove themselves from the directory at any time. Ratings are anonymous.

---

### Open Sessions: the agenda arrives by API

Proposing and voting happen on the **Open Space board**, which has its own
backend for running the day — editing and hiding topics, facilitator notes.
Rebuilding that here would have split the vote across two boards and produced a
top six drawn from a divided electorate, so this app receives the finished
agenda instead.

```
POST /api/open-sessions
Authorization: Bearer $OPEN_SESSIONS_TOKEN
{ "sessions": [ { "title": "…", "description": "…",
                  "facilitator": "…", "slot": "10:50 - 11:15",
                  "kind": "ask" } ],
  "announce": true }
```

Only `title` is required. Each push **replaces the whole agenda**, so pushing
again is how a mistake is corrected and `{"sessions": []}` clears it. The route
authenticates with its own bearer token, so it is exempt from the session
redirect in [PUBLIC_PATHS](lib/supabase/middleware.ts) and writes with the
service role — `open_agenda` has no write policy at all.

`announce` defaults to **true**: a push posts to the feed and notifies every
phone. Send `"announce": false` for test pushes once the invitation has gone
out.

Facilitator names render as **plain text**, never linked to profiles. The
source has one name field rather than a first and last, and topics can be
proposed anonymously, so matching them would be guesswork that occasionally
credits the wrong person.

Until the first push the tab shows a labelled example agenda and links to the
board.

### Speaker slides are switched off

The feature assumed speakers would hand over a PDF, or a link to one, before or
during the day. Almost none will, and a programme promising "slides will appear
here once this finishes" is worse than not offering it at all.

It is gated on `SLIDES_ENABLED` in [lib/slides.ts](lib/slides.ts), default off -
the form field, the download link, the card markers and the announcer's "slides
are available" post. Nothing was deleted, the `slides_url` column is untouched,
and saving a session while it is off will not wipe a URL already stored. Set
`SLIDES_ENABLED=true` to bring it back.

### The whiteboard scanner is switched off

Open Sessions are run on the Open Space board, so photographing a physical
board from this app is no longer needed. The whole flow - the Organiser card, `/scan`, and the
`/api/scan/*` routes - is gated behind `SCAN_ENABLED` in
[lib/scan/enabled.ts](lib/scan/enabled.ts), default off. Nothing was deleted.

It was the only thing that called the Anthropic API, so **`ANTHROPIC_API_KEY`
is unused and the account needs no credit** while it stays off. To revive it,
set `SCAN_ENABLED=true` in the environment (no code change) and fund the key
again.

---

## Running it locally

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

| Command | Does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build and typecheck |
| `npm run migrate` | Apply database migrations |
| `npm run db:verify` | Print tables, policies and buckets |
| `npm run extract:deck` | Read the speaker deck PDF into `Assets/speakers-pdf.json` (talk titles, descriptions, bios) |
| `npm run parse:speakers` | Merge the deck, the overview CSV and the headshots into `Assets/speakers.json` |
| `npm run import:people` | Create accounts and profiles from that (`--attendees file.csv` for the guest list) |
| `npm run import:programme` | Solve the running order from the availability CSVs and write it (`--write`; omit to preview) |
| `npm run seed:guests` | Ten test attendees on `+alias` addresses |
| `npm run seed:program` | Load the placeholder programme (`--clear` removes) |
| `npm run reset:demo` | Empty the feed and restore a clean demo state |
| `npm run test:scan` | Whiteboard reader, against a generated board |
| `npm run test:announcer` | Automatic announcements, incl. no-double-post |
| `npm run test:slides` | Slide publishing — the feature is off, kept for revival |
| `npm run test:clash` | Schedule overlap detection |

`GET /api/health` reports which settings are present without exposing them —
the quickest way to confirm a deployment is configured.

Secrets live in `.env.local`, never committed. The same values go into
Railway's variables for production.
