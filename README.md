# AIMC-CC

**A phone app (PWA) for the AI Meetup Copenhagen Community Conference #1 that keeps 200 attendees on the same page: live updates, the full programme with a personal schedule, and a directory so people can find each other. No app store, and no sign-up — profiles are created in advance, so people just sign in.**

🔗 **[aic-info-production.up.railway.app](https://aic-info-production.up.railway.app)**

---

## Contents

- [What it does](#what-it-does)
  - [Feed](#feed--live-updates-from-everyone)
  - [Program & My Schedule](#program--my-schedule)
  - [Session pages](#session-pages)
  - [Networking](#networking)
  - [Organiser tools](#organiser-tools)
  - [Automatic announcements](#automatic-announcements)
  - [Speaker slides](#speaker-slides)
  - [Ratings and feedback](#ratings-and-feedback)
- [Getting started](#getting-started)
- [What I need decisions on](#what-i-need-decisions-on)
- [Before the event](#before-the-event)
- [Measuring how it went](#measuring-how-it-went)
- [How it's built](#how-its-built)
- [Running it locally](#running-it-locally)

---

## What it does

Three tabs, plus an organiser area only organisers can see.

### Feed — live updates from everyone

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

**Open Sessions** are published on their own page, so that tab links out.

### Session pages

Tapping any session opens it: times, room, description, the speaker as a
tappable card, slides once available, and **Rate this session**.

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

### Speaker slides

Add a PDF link to a session and the app **posts that the slides are available
once that session has ended** — never before, so nobody hands out a deck while
its speaker is still presenting. A session without a link announces nothing.

### Ratings and feedback

**Rate this app** on the About page, and **Rate this session** on every session
— five stars plus an optional comment. Both are **anonymous**: who left a
rating is never shown and can't be looked up.

---

## Getting started

Five minutes, on your phone.

**1. Open it** → [aic-info-production.up.railway.app](https://aic-info-production.up.railway.app)

**2. Sign in** with your email. Your profile is already there — nothing to fill in.

**3. Add it to your home screen.** iPhone: **Share** → **Add to Home Screen**.
Android: Chrome offers to install it. Do this before testing notifications — on
iPhone they only work once installed.

**4. Turn on notifications** — your avatar, top right, below the form.

**5. Walk through it** with [TEST-PLAN.md](TEST-PLAN.md) — a guided tour that
doubles as a checklist, about 25 minutes.

> If you should have organiser access and don't see the **Organiser** button,
> send me your email address and it takes ten seconds.

---

## What I need decisions on

### 1. Email for sign-in — the blocker

Attendees sign in with a **magic link**: enter your email, click the link in
your inbox, you're in. No passwords.

**The problem:** the free email service bundled with our database allows only a
couple of messages an hour. Useless when 200 people arrive between 08:30 and
09:30.

**What's needed:** a real provider. **[Resend](https://resend.com), about $20
for the event month**, cancel after. Ten minutes to set up.

**Until then** sign-in is in test mode — entering an email logs you straight in
with no email sent. Fine for review, **cannot ship**: anyone with the link
could sign in as anyone.

*Decision: approve the ~$20, or tell me who to invoice.*

> **On the emailed sign-in link.** The plan was for the Brevo email to contain
> a link that signs each person straight in. I'd advise against it and have
> built the safer version: the email links to the app, the person enters their
> address, and the magic link goes to *their* inbox. A pre-made sign-in link
> sitting in a bulk email can be forwarded, screenshotted, or left open on a
> shared laptop — it *is* the credential. This way the email carries nothing
> sensitive, and it's still two taps.

### 2. The AI key

The whiteboard scanner uses Claude. It runs on **my personal API key** — about
3 cents per photo, so a couple of dollars for a heavy day.

*Either set up an account and send me the key, or I'll invoice the few dollars.*

### 3. Slide files

To publish slides I need **a URL per session, PDF only**. Hosting them yourself
and sending the links alongside the speaker details is simplest — then the app
posts them automatically as each talk ends.

---

## Before the event

- [ ] Set up Resend and switch off test-mode sign-in
- [ ] Load the real programme (arriving 24–48h before)
- [ ] Load the attendee list from checkin.no — **this is what I need most**
- [ ] Add slide URLs as speakers send them
- [ ] Add the Open Sessions page URL
- [ ] Add organisers and room hosts
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

**[Assets/metrics-framework.csv](Assets/metrics-framework.csv)** — the HEART
framework, ready to import into Google Sheets. Nineteen rows across Happiness,
Engagement, Adoption, Retention and Task Success, each with the goal, what's
tracked, the formula, and a stated hypothesis so a number can be read as good
or bad rather than merely recorded. Results and Learnings columns are left
empty to fill in afterwards.

**Analytics is [PostHog](https://posthog.com) on EU cloud** rather than Google
Analytics. This is an EU event with EU attendees, and PostHog keeps the data in
Frankfurt, which removes the data-transfer question instead of answering it.
It's also built for product metrics, so the HEART signals map onto it directly
and the dashboard takes minutes rather than a day.

It's configured so **no cookie banner is needed**: anonymous visitors aren't
profiled, autocapture and session recording are off, IP addresses aren't
stored, and the only identifier sent is an opaque user id — never a name or
address.

*Needs a free PostHog account and its project key adding to the environment.*

---

## How it's built

| | |
|---|---|
| **App** | Next.js 16, TypeScript, Tailwind |
| **Data, sign-in, photos** | Supabase — hosted in Ireland |
| **Hosting** | Railway — EU West |
| **Reading the whiteboard** | Claude (`claude-opus-5`) |
| **Analytics** | PostHog — EU cloud |
| **Notifications** | Web push |

**Why a website and not an App Store app:** no download, no review process, no
updates to install. Attendees open a link and save it to their home screen,
where it behaves like an app.

**On data.** Everything is in the EU. Profiles show no email addresses. People
can remove themselves from the directory at any time. Ratings are anonymous.

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
| `npm run parse:speakers` | Turn the supplied assets into `Assets/speakers.json` |
| `npm run import:people` | Create accounts and profiles from that (`--attendees file.csv` for the guest list) |
| `npm run seed:program` | Load the placeholder programme (`--clear` removes) |
| `npm run reset:demo` | Empty the feed and restore a clean demo state |
| `npm run test:scan` | Whiteboard reader, against a generated board |
| `npm run test:announcer` | Automatic announcements, incl. no-double-post |
| `npm run test:slides` | Slide publishing, incl. never posting without a URL |
| `npm run test:clash` | Schedule overlap detection |

`GET /api/health` reports which settings are present without exposing them —
the quickest way to confirm a deployment is configured.

Secrets live in `.env.local`, never committed. The same values go into
Railway's variables for production.
