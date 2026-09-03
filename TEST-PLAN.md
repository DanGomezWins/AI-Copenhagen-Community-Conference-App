# Test plan — AIMC-CC

Every part of the app, in the order you'd naturally meet it. Doubles as a
guided tour: if you've never used it, working top to bottom shows you
everything it does.

🔗 **[aic-info-production.up.railway.app](https://aic-info-production.up.railway.app)**

**About 25 minutes.** Do it on your phone.

---

## 🔗 Start here — the link an attendee gets

This is what an attendee will find in the email inviting them to the app. Tap
it and you arrive **already signed in as Test Guy**, exactly as they will.

**[Sign in as Test Guy →](https://aic-info-production.up.railway.app/dev/signin?email=dangomezwindshuttle%2Btest_guy%40gmail.com)**

```
https://aic-info-production.up.railway.app/dev/signin?email=dangomezwindshuttle%2Btest_guy%40gmail.com
```

> **Test Guy** is a guest, not a speaker and not an organiser — the plain
> attendee experience. His email is `dangomezwindshuttle+test_guy@gmail.com`,
> a plus-alias on your own inbox, so any real email to him actually arrives.
>
> **Sections 9–12 need organiser rights**, which Test Guy does not have. Sign
> in with your own address for those.
>
> **Nine other test guests** exist for the directory — same pattern:
> `dangomezwindshuttle+first_last@gmail.com`. Sign in as any of them the same
> way by swapping the email in that link.

> ### ⚠️ On iPhone, that link opens Safari — not the installed app
>
> Apple has never allowed a link in an email to open a Home Screen web app, and
> there is no way to build around it. Worse, an installed iPhone web app keeps
> **its own sign-in, separate from Safari's** — so signing in via the link and
> installing afterwards means signing in *twice*.
>
> **So the order matters, and the app now says so.** Install first, then sign in
> from the icon. Test 1.5 checks that guidance appears.
>
> **On Android none of this applies:** an installed app handles its own links,
> and the sign-in carries over.

---

## How to record results

Put a mark in the **Result** column and anything you noticed in **Notes**.

`✅` works as described · `⚠️` works but something's off · `❌` broken ·
`–` couldn't test

Rough notes are fine — half a sentence is enough to act on.

---

## Contents

| # | Section | What it covers |
|---|---|---|
| [1](#1-getting-in) | Getting in | Sign-in, install to home screen |
| [2](#2-your-profile) | Your profile | Prefilled profile, editing, photo |
| [3](#3-the-programme) | The programme | Tracks, times, dimming, Open Sessions |
| [4](#4-my-schedule) | My Schedule | Starring, personal chronological list |
| [5](#5-session-pages) | Session pages | Details, speaker card, rating |
| [6](#6-networking) | Networking | Directory, search, speaker profiles |
| [7](#7-the-feed) | The feed | Posting, photos, links, moderation |
| [8](#8-about-and-rating-the-app) | About & rating | About page, app rating |
| [9](#9-organiser-schedule-editing) | Schedule editing | *Organisers* |
| [10](#10-organiser-slides) | Slides | *Organisers* |
| [11](#11-organiser-feedback-review) | Feedback review | *Organisers* |
| [12](#12-organiser-announcements-and-notifications) | Announcements | *Organisers* |
| [13](#13-the-whiteboard-scanner) | Whiteboard scanner | Currently deactivated |
| [14](#14-design-and-general) | Design & general | Colours, fonts, layout |
| [15](#15-anything-else) | Anything else | Free notes |

> Sections 9–12 need organiser access — you'll see an **Organiser** button in
> the top bar. If you don't, send me your email address.

---

## 1. Getting in

| # | Test | Expected | Result | Notes |
|---|---|---|---|---|
| 1.1 | Open the link | A sign-in screen appears, titled with the conference name | | |
| 1.2 | Test-mode notice | An amber box explains no email will be sent yet | | |
| 1.3 | **Arrive via the link above** | You land signed in as **Test Guy**, no password | | |
| 1.3b | Sign in normally | Signing out and entering an email also works. **In test mode you go straight in; with real email live you'd type a six-digit code** | | |
| 1.4 | Where you land | The Feed, with the event name and a Meetup link at the top | | |
| 1.5 | **Install-first guidance** | On the **sign-in** screen, an iPhone shows a purple box: "Add to your home screen first" and explains you'd otherwise sign in twice | | |
| 1.5b | Install banner when signed in | Already signed in **in Safari**, the Feed shows "Add this to your home screen" and warns about the second sign-in. "Got it" dismisses it for good | | |
| 1.5c | Add to home screen | iPhone: Share → Add to Home Screen. Android: Chrome offers to install | | |
| 1.5d | **Sign in inside the app** | Opening from the icon on iPhone, you're asked to sign in again — expected, and only once | | |
| 1.5e | Banner gone once installed | Neither box appears inside the installed app | | |
| 1.6 | Icon | Purple square, white ring, mint centre | | |
| 1.7 | Launch from the icon | Opens full screen, no browser bar, still signed in | | |
| 1.8 | Loading | A spinner, never a blank white screen | | |

> **Why no email arrives yet:** sign-in is in test mode until a real email
> provider is approved. Deliberately a code, not a link: on iPhone a link would
> open Safari and leave the installed app signed out. See
> [the README](README.md#1-email-for-sign-in--the-blocker).

### 1a. The real sign-in, simulated

You can test the actual code flow right now. The code is genuine and is
verified by Supabase exactly as an attendee's would be — **only the email
delivery is simulated**, so it appears on screen instead of in an inbox.

| # | Test | Expected | Result | Notes |
|---|---|---|---|---|
| 1a.1 | Sign out, then open **/login** | The email form | | |
| 1a.2 | Enter `dangomezwindshuttle+test_guy@gmail.com` and tap **Sign in** | A red "Test mode — no email was sent" panel appears with a real code in it | | |
| 1a.3 | Type that code into the box below it | | | |
| 1a.4 | Tap **Sign in** | You're signed in as Test Guy and land on the Feed | | |
| 1a.5 | Wrong code | Type any wrong number — "That code isn't right", and you stay put | | |
| 1a.6 | Send a new code | "Send a new code" is throttled for 30 seconds, then issues a fresh one | | |
| 1a.7 | Unknown address | Try `nobody@example.com` — "No account for that address", and no account is created | | |
| 1a.8 | Numeric keypad | On a phone the code box brings up digits, not letters | | |

> **The code is 8 digits, not 6.** That is this Supabase project's setting.
> Testing caught it — the form originally required exactly six, which would
> have left the button permanently disabled for every attendee. It now accepts
> 6–8.

---

## 2. Your profile

**Tap your avatar, top right.** Your profile already exists — you shouldn't
have to create anything.

| # | Test | Expected | Result | Notes |
|---|---|---|---|---|
| 2.1 | Reach your profile | Avatar top-right opens it directly | | |
| 2.2 | It's prefilled | Name, and for speakers title/company/bio/photo already there | | |
| 2.3 | No email field | Your email appears **nowhere** on the profile | | |
| 2.4 | "About you" | A free-text box for a professional summary | | |
| 2.5 | LinkedIn helper | "Open my LinkedIn ↗" opens *your* LinkedIn to copy the address | | |
| 2.6 | Edit and save | Change your role, save, reopen — the change stuck | | |
| 2.7 | Add a photo | Appears within a few seconds, replacing your initials | | |
| 2.8 | Remove the photo | Falls back to initials on a coloured circle | | |
| 2.9 | Blank name refused | Clearing your first name and saving is rejected | | |
| 2.10 | Leave the directory | "Remove me from the directory" — you stay signed in, just unlisted | | |

---

## 3. The programme

| # | Test | Expected | Result | Notes |
|---|---|---|---|---|
| 3.1 | Open Program | Main stage shows the full day | | |
| 3.2 | Four tabs | Main stage · Demos · Open sessions · ★ My Schedule | | |
| 3.3 | Day structure | Registration, breaks, lunch, drinks appear among the sessions | | |
| 3.4 | Copenhagen time | 08:30 registration, 11:50 lunch, 15:30 keynote | | |
| 3.5 | Danish characters | Ø, æ, å all render (Nørregaard, Bæk, Ødegård) | | |
| 3.6 | Real speakers | Actual speaker names, not invented ones | | |
| 3.7 | **Finished sessions dim** | Anything already past fades back and is labelled "Finished" | | |
| 3.8 | Happening now | The current session is outlined and badged "Now" | | |
| 3.9 | **Open Sessions** | Links out to a separate page — a notice explains it's published there | | |
| 3.10 | No stars on breaks | Lunch and breaks have no ☆ — you don't choose to attend lunch | | |

> **About the programme.** Speakers, times and rooms come from the two
> availability CSVs — those are real. **Talk titles do not exist in that source
> material at all**, so every session reads "Session — title to be confirmed"
> rather than carrying an invented one. The pairing of speaker to slot is
> derived from who said they were available when, so treat it as a plausible
> draft, not the final running order.

---

## 4. My Schedule

| # | Test | Expected | Result | Notes |
|---|---|---|---|---|
| 4.1 | Star a session | The ☆ fills instantly, without a pause | | |
| 4.2 | Open My Schedule | The starred session is listed | | |
| 4.3 | Star across rooms | Star something in Demos too — both appear in one list | | |
| 4.4 | Chronological | Sorted by time, not grouped by room | | |
| 4.5 | Room labelled | Each entry says which room it's in | | |
| 4.6 | Unstar | Tapping ★ again removes it from My Schedule | | |
| 4.7 | Empty state | With nothing starred, it explains what to do rather than sitting blank | | |
| 4.8 | It persists | Close the app, reopen — your stars are still there | | |

---

## 5. Session pages

| # | Test | Expected | Result | Notes |
|---|---|---|---|---|
| 5.1 | Open a session | Tapping a session card opens its own page | | |
| 5.2 | Details | Time, room, title, and description if set | | |
| 5.3 | Speaker card | The speaker as a tappable card with photo and title | | |
| 5.4 | Through to profile | Tapping it opens their full profile | | |
| 5.5 | Star from here | The ☆ works on this page too | | |
| 5.6 | Back goes back | Returns where you came from — Program *or* My Schedule | | |
| 5.7 | Rate this session | Opens a modal: five stars plus an optional comment | | |
| 5.8 | Send a rating | Confirms, then closes | | |
| 5.9 | Revise it | Reopening shows your rating; changing it replaces rather than duplicates | | |
| 5.10 | Anonymity stated | The page says the rating is anonymous | | |

---

## 6. Networking

| # | Test | Expected | Result | Notes |
|---|---|---|---|---|
| 6.1 | Open Networking | The directory lists everyone with a profile | | |
| 6.2 | You're listed | Find yourself | | |
| 6.3 | Speaker photos | Real speakers show their headshots | | |
| 6.4 | Filters | Everyone / Speakers / Guests, each with a count | | |
| 6.5 | Search by name | Type `werdelin` | | |
| 6.6 | Search by company | Type `zeronorth` | | |
| 6.7 | **Danish, plain** | `norgaard` (no ø) still finds Nørregaard | | |
| 6.8 | **Danish, accented** | `ødegård` also works | | |
| 6.9 | No results | A friendly message, not a blank screen | | |
| 6.10 | Speaker profile | Photo, title, company, **bio**, LinkedIn, their sessions | | |
| 6.11 | **No email shown** | No email address anywhere on anyone's profile | | |
| 6.12 | **Cancelled sessions hidden** | A cancelled session does **not** appear struck through on a profile | | |

---

## 7. The feed

**Anyone can post now** — not just organisers.

| # | Test | Expected | Result | Notes |
|---|---|---|---|---|
| 7.1 | Post button | Visible to everyone, top right of the Feed | | |
| 7.2 | Post text | Appears at the top of the feed with your name and photo | | |
| 7.3 | Character limit | Counter caps at 500 and the button disables past it | | |
| 7.4 | **Post a photo** | Pick one; it uploads and appears in the feed | | |
| 7.5 | **Post a link** | Type `example.com`; it renders as a tappable link | | |
| 7.6 | Edit your own | Edit, save — marked "edited" | | |
| 7.7 | Delete your own | Deleting returns you to the Feed | | |
| 7.8 | **Organiser posts differ** | Organiser posts are tinted and badged "Organiser" | | |
| 7.9 | Alert style | *Organisers:* "Mark as an alert" highlights it in red | | |
| 7.10 | Alerts are restricted | A non-organiser sees no alert option | | |
| 7.11 | **Moderation** | *Organisers:* every post has a "Moderate" link to delete it | | |
| 7.12 | Live update *(2 devices)* | Post on one, it appears on the other **without refreshing** | | |
| 7.13 | Empty post refused | Submitting nothing is rejected | | |

---

## 8. About and rating the app

| # | Test | Expected | Result | Notes |
|---|---|---|---|---|
| 8.1 | Open About | "About" in the top bar | | |
| 8.2 | The blurb | Explains what the app is and that it's an experiment | | |
| 8.3 | Both names linked | Your name and Martin's link to your profiles | | |
| 8.4 | Rate this app | Opens the same star modal | | |
| 8.5 | Free text | Labelled "We'd love to hear your feedback or suggestions — it's anonymous" | | |
| 8.6 | Submit | Confirms and closes | | |
| 8.7 | Revise | Reopening shows your rating and lets you change it | | |

---

## 9. Organiser: schedule editing

**Organiser → Edit the schedule.**

| # | Test | Expected | Result | Notes |
|---|---|---|---|---|
| 9.1 | Open it | All rooms listed, grouped | | |
| 9.2 | Add a session | Room, title, speaker, start time | | |
| 9.3 | End time follows | Setting a start fills the end automatically; moving the start moves it | | |
| 9.4 | Room is a choice | Three fixed rooms, no free-text box | | |
| 9.5 | **Description** | A description field, shown on the session page | | |
| 9.6 | Move a session | Change the time, leave "Tell attendees" ticked | | |
| 9.7 | Change announced | The Feed shows what moved and what it was before | | |
| 9.8 | **Typo stays quiet** | Changing one letter of a title posts **nothing** — deliberate | | |
| 9.9 | Opt out | Unticking "Tell attendees" posts nothing | | |
| 9.10 | **Room clash warns** | Two sessions in one room at one time warns, naming the clash — but still saves | | |
| 9.11 | Cancel | Stays visible struck through in the Program | | |
| 9.12 | Restore | Puts it back | | |
| 9.13 | Delete | Removes it entirely | | |

---

## 10. Organiser: slides

| # | Test | Expected | Result | Notes |
|---|---|---|---|---|
| 10.1 | Slides field | The session form has a "Slides URL (PDF)" box | | |
| 10.2 | Before it ends | Add a URL to a **future** session. Its page says slides will appear once it's finished — no download yet | | |
| 10.3 | **After it ends** | Add a URL to a session already finished. Within a minute the Feed says the slides are available | | |
| 10.4 | Download appears | That session's page now shows a download button | | |
| 10.5 | **No URL, no post** | A finished session **without** a URL never announces anything | | |
| 10.6 | No double-posting | It announces once, not repeatedly | | |

> Use **Organiser → Edit the schedule** to set a session's end time to a few
> minutes ago, and give it any PDF link, to test 10.3.

---

## 11. Organiser: feedback review

**Organiser → Ratings & feedback.**

| # | Test | Expected | Result | Notes |
|---|---|---|---|---|
| 11.1 | Open it | Averages for the app and for sessions | | |
| 11.2 | Two-column table | Stars beside the comment | | |
| 11.3 | Your ratings | The ones you left in 5.8 and 8.6 appear | | |
| 11.4 | Grouped by session | Session ratings grouped under each session, busiest first | | |
| 11.5 | **Anonymous** | No name anywhere — you can't tell who said what | | |

---

## 12. Organiser: announcements and notifications

⚠️ **Do this from the home-screen app**, not the browser — on iPhone
notifications only work once installed.

| # | Test | Expected | Result | Notes |
|---|---|---|---|---|
| 12.1 | Turn on notifications | Avatar → scroll down → allow | | |
| 12.2 | Confirms | "Notifications are on" | | |
| 12.3 | Test notification | Organiser → Testing tools → Send a test — it arrives | | |
| 12.4 | Tapping opens the app | | | |
| 12.5 | Create a test session | Testing tools → **+3 min**, listed as "waiting" | | |
| 12.6 | Wait a minute | Reload — it says "announced ✓" | | |
| 12.7 | Correct time | The time shown is Copenhagen time, not two hours out | | |
| 12.8 | In the Feed | "Next up at HH:MM …" appears, badged as automatic | | |
| 12.9 | Notification arrived | | | |
| 12.10 | **No double-posting** | Tap "Run announcer now" three times — still only one post | | |
| 12.11 | Not-yet-due | **+30 min**, run it — nothing posts, too far out | | |
| 12.12 | **Kill switch** | Organiser → turn announcements off; create +3 min and run — nothing posts | | |
| 12.13 | Back on | Toggling back on, it posts again | | |
| 12.14 | Buttons show they're pressed | Every organiser button shows a spinner while working | | |
| 12.15 | Clean up | "Remove test sessions" clears them *(check the Feed first)* | | |

---

## 13. The whiteboard scanner

**Currently deactivated** — Open Sessions moved to a separate system. The
scanner still works at `/scan` and can be switched back on. Only test if you're
curious.

| # | Test | Expected | Result | Notes |
|---|---|---|---|---|
| 13.1 | Reach it | `/scan` still loads | | |
| 13.2 | Read a board | Photograph a handwritten list; it reads it | | |

---

## 14. Design and general

| # | Test | Expected | Result | Notes |
|---|---|---|---|---|
| 14.1 | **Light throughout** | No dark mode anywhere, even with your phone in dark mode | | |
| 14.2 | Brand purple | Buttons and links are `#4309FF` | | |
| 14.3 | Readable | Text is high contrast and comfortable in daylight | | |
| 14.4 | Inter font | Clean sans-serif throughout | | |
| 14.5 | App name | **AIMC-CC** in the top bar and on the home-screen icon | | |
| 14.6 | Full name | Spelled out on the Feed and the sign-in screen | | |
| 14.7 | Tap targets | Nothing fiddly to hit one-handed | | |
| 14.8 | No overflow | Nothing spills off the side of the screen | | |
| 14.9 | Speed | Screens open quickly on mobile data | | |

---

## 15. Anything else

Confusing wording, awkward taps, anything that felt wrong. Wording counts — if
a button doesn't say what you'd expect, that's worth knowing.

-
-
-
-

---

## Known and deliberate

Things you might flag that are intentional:

- **No email arrives when signing in.** Test mode until Resend is approved.
- **Talk titles are placeholders.** The speakers, photos and bios are real; the
  programme arrives 24–48h before.
- **Open Sessions has no listing.** It links out; the URL is still to come.
- **Two speakers are incomplete.** Sofie Hvitved has no title or bio, Xander
  Evangelidis has no bio — neither is in the source material.
- **Attendees aren't loaded yet.** Ten test guests stand in until the
  checkin.no export arrives. They are the only accounts with a `+` in the
  address, so they are easy to remove.
- **Talk titles all read "Session — title to be confirmed".** The two
  programme CSVs are availability forms — which slots each speaker *could*
  do — and contain no titles at all. Times and speakers are real; the pairing
  is derived, and the titles are honestly blank rather than invented.
- **Two speakers are not on the programme.** Arun Prakash and Thomas Martinsen
  gave no availability in either CSV.
- **The icon is a placeholder** until brand assets arrive.
- **On iPhone the email link opens Safari, not the app.** An Apple limitation
  with no workaround. The app now tells people to install before signing in,
  which avoids the double sign-in it would otherwise cause. Android is fine.
