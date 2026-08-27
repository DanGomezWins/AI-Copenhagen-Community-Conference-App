# AIC Info

**A phone app (PWA) for the AI Meetup Copenhagen Community Conference #1 that keeps 200 attendees on the same page: live updates from the organisers, the full three-track programme, and a directory so people can find each other. No app store — attendees open a link and save it to their home screen.**

🔗 **[aic-info-production.up.railway.app](https://aic-info-production.up.railway.app)**

---

## Contents

- [What it does](#what-it-does)
  - [Feed](#feed--live-updates)
  - [Program](#program--the-schedule)
  - [Networking](#networking--who-else-is-here)
  - [Organiser tools](#organiser-tools)
  - [Automatic announcements](#automatic-announcements)
  - [The whiteboard scanner](#the-whiteboard-scanner)
- [Getting started](#getting-started)
- [Two things I need a decision on](#two-things-i-need-a-decision-on)
- [Before the event](#before-the-event)
- [How it's built](#how-its-built)
- [Running it locally](#running-it-locally)

---

## What it does

Three tabs, and an organiser area only organisers can see.

### Feed — live updates

The home screen. Organisers post updates and they appear on every attendee's
phone **instantly**, without anyone refreshing. Room changed, running late,
lunch is served, wifi password — anything.

Posts can be tagged to a track and marked as an alert. They can be edited or
deleted after the fact, because a wrong "back in 10 minutes" can't be unsent,
but it can be corrected.

### Program — the schedule

All three tracks — **Main stage**, **Demos**, **Open sessions** — with the
day's structure (registration, breaks, lunch, drinks) laid in. Times are always
Copenhagen time, whatever the phone is set to. The session happening *now* is
highlighted, past ones dim, cancelled ones are struck through rather than
vanishing.

Speaker names link through to that person's profile.

### Networking — who else is here

A searchable directory of everyone who's added a profile. Filter by speaker or
guest, search by name, company or role, tap through for LinkedIn and email.

Search handles Danish properly: typing `norgaard` finds **Nørgaard**, `odegard`
finds **Ødegård**, and `aagaard` and `agaard` both work. Most attendees will be
typing on English keyboards.

Profiles are **opt-in** — nobody appears until they create one, and they can
remove themselves at any time.

### Organiser tools

Hidden entirely from attendees. Organisers get an **Organiser** button in the
top bar leading to:

| | |
|---|---|
| **Post an update** | Write and publish to every phone |
| **Edit the schedule** | Add, move, cancel or restore any session. Moving a session's time or room posts the notice automatically — fixing a typo doesn't. Warns if two sessions land in the same room at once. |
| **Who can post** | Add or remove organisers by email, on the day if needed |
| **Testing tools** | Rehearse announcements and notifications before the event |

### Automatic announcements

The app posts **"Next up: [session] — [speaker]"** five minutes before every
session, on its own, all day. Break and lunch markers too. Nobody has to
remember.

It won't double-post if the server restarts, and a rescheduled session
re-announces at its new time rather than being skipped. **There's an off switch
on the organiser screen** — if the day runs late and the schedule drifts, turn
it off rather than have the app confidently announce sessions that aren't
happening.

### The whiteboard scanner

Open Sessions are decided during the day on a physical board, which makes them
the hardest thing to keep current.

**Photograph the board and the app reads it.** It handles what a real board
looks like — mixed time formats (`9.55`, `2:20pm`), crossed-out lines treated
as cancellations, messy handwriting. It shows you a colour-coded diff of what
changed before anything is published: green new, amber changed, red removed.

Anything it wasn't sure about is flagged. If something's wrong, **type the
correction in plain English** — *"the 14:20 one ends at 14:45, and the name is
Ida, not Ada"* — and it fixes just that. Then publish, and the programme and
feed both update.

**Any attendee can do this**, not just organisers — if you've written your own
session on the board, snap it and it goes live.

---

## Getting started

Five minutes, on your phone.

**1. Open it** → [aic-info-production.up.railway.app](https://aic-info-production.up.railway.app)

**2. Sign in.** Enter your email. Right now it signs you straight in without
sending anything — see [the email question](#1-email-for-sign-in) below.

**3. Add it to your home screen.** On iPhone: **Share** → **Add to Home
Screen**. On Android, Chrome offers to install it. Do this before testing
notifications — on iPhone they only work once it's installed.

**4. Fill in your profile.** Tap your avatar, top right.

**5. Turn on notifications.** Same screen, below the form.

**6. Have a look around** using [TEST-PLAN.md](TEST-PLAN.md) — a guided tour
that doubles as a checklist, about 20 minutes.

> If you should have organiser access and don't see the **Organiser** button in
> the top bar, tell me your email address and it takes ten seconds to add.

---

## Two things I need a decision on

### 1. Email for sign-in

Attendees sign in with a **magic link** — enter your email, click the link,
you're in. No passwords to forget at a registration desk.

**The problem:** the free email service that comes with our database only
allows a couple of messages per hour. Fine for me testing; useless when 200
people arrive between 08:30 and 09:30 and all sign in at once.

**What's needed:** a proper email provider. [Resend](https://resend.com) is the
straightforward choice — **around $20 for the event month**, cancel afterwards.
Roughly ten minutes to set up.

**Until then**, sign-in is in test mode: entering an email logs you straight in
with no email sent. That's fine for review but **cannot ship** — anyone with
the link could sign in as anyone.

*Decision needed: approve the ~$20, or tell me who to send the invoice to.*

### 2. The AI key for the whiteboard scanner

The scanner uses Claude to read the board. It currently runs on **my personal
API key**.

It's genuinely cheap — **about 3 cents per photo**, so a heavy day is a couple
of dollars. But it's billed to me, and it shouldn't be long-term.

*Either set up an account and send me the key, or I'll keep using mine and
invoice the few dollars afterwards — whichever is less hassle.*

---

## Before the event

Reminders, not open questions. I'll handle these.

- [ ] Set up Resend and switch off test-mode sign-in
- [ ] Load the real programme (25 sessions) — replaces the placeholder one
- [ ] Load the attendee list from checkin.no, used to pre-fill profiles and gate sign-in
- [ ] Clear the placeholder people and sessions
- [ ] Add organisers and any room hosts
- [ ] Replace the placeholder icon with real branding *(logo files welcome)*

**Two things I'd like from you when convenient:** the **final programme** —
titles, speakers, times, tracks — and the **attendee export** with emails. The
sooner the programme lands, the sooner the app is showing something real.

---

## How it's built

| | |
|---|---|
| **App** | Next.js 16, TypeScript, Tailwind |
| **Data, sign-in, photos** | Supabase — hosted in Ireland |
| **Hosting** | Railway — EU West |
| **Reading the whiteboard** | Claude (`claude-opus-5`) |
| **Notifications** | Web push |

**Why a website and not an App Store app:** no download, no review process, no
updates to install. Attendees open a link and save it to their home screen,
where it behaves like an app — full screen, own icon, lock-screen
notifications.

**On data.** Everything is in the EU. The directory is opt-in, and people can
remove themselves. The attendee list is used only to check tickets and pre-fill
a profile — it never becomes a public listing on its own. Attendees can only
see the directory once signed in.

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
| `npm run db:verify` | Print tables, security policies and buckets |
| `npm run seed:program` | Load placeholder sessions (`--clear` removes) |
| `npm run seed:people` | Load placeholder attendees (`--clear` removes) |
| `npm run test:scan` | Whiteboard reader, against a generated test board |
| `npm run test:announcer` | Automatic announcements, incl. no-double-post |
| `npm run test:clash` | Schedule overlap detection |

`GET /api/health` reports which settings are present, without exposing any of
them — the quickest way to confirm a deployment is configured.

Secrets live in `.env.local`, which is never committed. The same values go into
Railway's variables for production.
