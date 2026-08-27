# Guided tour & test checklist

A walk through everything the app does, in the order you'd naturally meet it.
It doubles as a test checklist — tick things off as you go.

**About 20 minutes.** Do it on your phone. Anything that looks wrong, note it
next to the item; rough is fine.

🔗 **[aic-info-production.up.railway.app](https://aic-info-production.up.railway.app)**

---

## Contents

1. [Getting in](#1-getting-in)
2. [Your profile](#2-your-profile)
3. [The programme](#3-the-programme)
4. [Networking](#4-networking)
5. [Posting updates](#5-posting-updates) *(organisers)*
6. [Editing the schedule](#6-editing-the-schedule) *(organisers)*
7. [The whiteboard scanner](#7-the-whiteboard-scanner)
8. [Notifications](#8-notifications)
9. [Automatic announcements](#9-automatic-announcements) *(organisers)*
10. [Anything else](#10-anything-else)

> Sections 5, 6 and 9 need organiser access — you'll see an **Organiser**
> button in the top bar. If you don't, send me your email and I'll add you.

---

## 1. Getting in

- [ ] Open the link. You get a sign-in screen.
- [ ] Enter your email and tap **Sign in** — you go straight in, no email sent.
- [ ] **Add it to your home screen.** iPhone: **Share** → **Add to Home
      Screen**. Android: Chrome offers to install it.
      *Do this now — notifications on iPhone only work once it's installed.*
- [ ] Open it from the home-screen icon. Full screen, no browser bar, still
      signed in.

> **Why no email arrives yet:** sign-in is in test mode. The real version emails
> you a link to click. See [Email for sign-in](README.md#1-email-for-sign-in) in
> the README — it needs a decision.

---

## 2. Your profile

Your profile is how other attendees find you. **Tap your avatar, top right.**

- [ ] Fill in name, whether you're speaking, company and role
- [ ] Tap **Open my LinkedIn ↗** next to the LinkedIn field — it opens *your*
      profile, so you can copy the address and paste it back
- [ ] Save. Add a photo.
- [ ] Reopen it — your changes are still there

> There's a **Remove me from the directory** option at the bottom. You stay
> signed in, you just stop being listed. Every attendee has this.

---

## 3. The programme

- [ ] Tap **Program**. Main stage shows the full day.
- [ ] Switch between **Main stage**, **Demos** and **Open sessions**
- [ ] Registration, breaks, lunch and drinks appear as thin dividers between
      sessions, not as sessions themselves
- [ ] Times read as Copenhagen time — 08:30 registration, 11:50 lunch,
      15:30 keynote
- [ ] Danish characters render properly (Ø, æ, å)
- [ ] **Tap a speaker's name** — it opens their profile
- [ ] The back arrow returns you to the **Program**, not somewhere else

> The sessions in there now are **placeholders** so the app has something to
> show. They get replaced with the real 25 when the programme is ready.

---

## 4. Networking

- [ ] Tap **Networking**. You should see yourself in the list.
- [ ] Try the **Speakers** and **Guests** filters
- [ ] Search a name, a company, a role
- [ ] **Search `norgaard`** with no ø — it should still find Nørgaard-Bech
- [ ] Search something nonsense — you get a friendly message, not a blank screen
- [ ] Open someone's profile; tap their LinkedIn

---

## 5. Posting updates
*Organisers*

This is the thing you'll use most on the day.

- [ ] On the **Feed**, tap **Post** (top right)
- [ ] Write something and post it. You land back on the Feed with it at the top.
- [ ] Post another, tagged **Demos** — it shows a Demos badge
- [ ] Post one with **Mark as an alert** ticked — it's highlighted
- [ ] Tap **Edit** under a post, change it, save — it's marked "edited"
- [ ] Edit one and **delete** it — you land back on the Feed
- [ ] **If you have a second device:** open the Feed on it, then post from the
      first. It should appear **without refreshing**.

> Track tags are a label, not a filter — everyone still sees every post. Nobody
> can accidentally filter themselves out of something urgent.

---

## 6. Editing the schedule
*Organisers*

**Organiser → Edit the schedule.** For when a speaker cancels, a session moves,
or the day slips.

- [ ] **Add** a session — pick a room, title, speaker, a start time
- [ ] Notice the **end time fills in automatically** and follows if you change
      the start
- [ ] Check it appears in the Program
- [ ] Edit a session and **change its time**. Leave *Tell attendees* ticked.
- [ ] Look at the Feed — there's a notice saying what moved and what it was before
- [ ] Now edit a session and **change one letter of the title**. Save.
      **No notice** — that's deliberate. An announcer that fires on every typo
      trains people to ignore it.
- [ ] **Cancel** a session — it stays in the Program struck through, so people
      who saw it know it's gone. **Restore** puts it back.
- [ ] Try moving a session into a room that's already busy at that time — you
      get a warning naming the clash. It **warns rather than blocks**, in case
      you meant it.

> The three tracks *are* the three rooms, so choosing the room chooses the track.

---

## 7. The whiteboard scanner

The hardest thing to keep current is Open Sessions, since they're decided on a
board during the day. **Anyone can use this**, not just organisers.

**First, make a fake board.** On paper, write four or five lines:

```
OPEN SESSIONS

9:30  - 9:55   AI in Government        Ida Munk-Jespersen
9.55  - 10:20  Prompt Engineering      Gustav Hillerod
10:20 - 10:45  Hiring for AI Teams     Signe Holm        <- cross this one out
2:20pm- 2:45pm Worst Failure Stories   [your own name]
```

Mix the time formats and cross one line out on purpose — that's what a real
board looks like. Put **your own name** on one line.

Then: **Program → Open sessions → Scan**.

- [ ] Photograph your paper. After a few seconds you get a review screen.
- [ ] `9.55` and `2:20pm` have become 09:55 and 14:20
- [ ] The crossed-out line is **not** included — and it tells you why
- [ ] Anything it was unsure of is flagged
- [ ] Type a correction in plain English — *"the 9:30 one ends at 10:00"* —
      and tap **Apply correction**. Only that row changes.
- [ ] **Publish**. Check the Program, then the Feed.
- [ ] **Your own name is a link** to your profile
- [ ] Change a time on your paper and rescan — it shows **changed**, not
      duplicates
- [ ] Cross out another line and rescan — it shows **removed**, and after
      publishing it's struck through rather than gone
- [ ] Photograph something blank — it says so rather than breaking

> Nothing reaches attendees until you tap Publish. Each line needs **start, end,
> title and full name** — no room, since they're all in the same one.

---

## 8. Notifications

⚠️ **Do this from the home-screen icon, not the browser.** On iPhone,
notifications only work once the app is installed.

- [ ] Tap your avatar → scroll down → **Turn on notifications** → allow
- [ ] It confirms notifications are on
- [ ] *Organisers:* **Organiser → Testing tools → Send a test notification** —
      it should arrive
- [ ] Tap the notification — it opens the app
- [ ] Lock your phone, have someone post an update — it arrives on the lock screen

> Notifications are a bonus, never the main channel. If they fail for someone,
> the Feed still works — it's the source of truth.

---

## 9. Automatic announcements
*Organisers*

The app posts **"Next up: …"** five minutes before every session, by itself,
all day. This is where you check that, and turn it off if you need to.

**Organiser → Testing tools.** The real programme is all on 10 September, so
these buttons create a test session dated *today* instead.

- [ ] Tap **+3 min**. It appears below as "waiting".
- [ ] Wait about a minute, then reload. It says **announced ✓**.
- [ ] The announcement is listed on that page, and on the **Feed**
- [ ] If notifications are on, one arrived
- [ ] Tap **Run announcer now** two or three times — still only **one** post.
      It can't double-post.
- [ ] Tap **+30 min**, then **Run announcer now** — nothing. Too far out.
- [ ] **Organiser → Turn off** automatic announcements. Make another **+3 min**
      and run it — nothing posts. **This is the switch to use if the day runs
      late** and the schedule stops matching reality.
- [ ] Turn it back on
- [ ] **Remove test sessions and their posts** to tidy up
      *(check the Feed first — it deletes the announcements too)*

---

## 10. Anything else

Anything confusing, awkward, slow, or just wrong. Wording included — if a
button doesn't say what you'd expect, that's worth knowing.

-
-
-

---

**Two decisions are waiting** — email sign-in and the AI key. Both are in the
[README](README.md#two-things-i-need-a-decision-on), and neither takes long.
