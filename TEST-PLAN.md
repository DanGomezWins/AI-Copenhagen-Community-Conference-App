# Test plan — AIMC-CC

Every part of the app, in the order you'd naturally meet it. Doubles as a
guided tour: if you've never used it, working top to bottom shows you
everything it does.

🔗 **[aic-info-production.up.railway.app](https://aic-info-production.up.railway.app)**

**About 25 minutes.** Do it on your phone.

---

## 🔗 Start here

**Open the app on your phone:**

**[https://aic-info-production.up.railway.app](https://aic-info-production.up.railway.app)**

That is exactly what the invitation email will contain — a plain link to the
app, nothing more. You sign in from inside the app, with a code.

> ### If you are already signed in
> Tap your avatar (top right) → **Sign out**, so you start where an attendee
> starts. Section 1 assumes you are signed out.

**You will need to switch accounts once, part way through.** Sections 1-8 are
the ordinary attendee experience and must be done as **Test Guy**, who has no
organiser rights - that is the point, it proves attendees cannot reach the
organiser tools. Sections 9-14 need organiser rights, so you sign out and back
in as yourself. Each section says which account it wants, and the switch is
called out where it happens.

### Who to sign in as

| Use               | Email                                    | Why                                                          |
| ----------------- | ---------------------------------------- | ------------------------------------------------------------ |
| **Sections 1–8**  | `dangomezwindshuttle+test_guy@gmail.com` | Test Guy is a plain guest — the ordinary attendee experience |
| **Sections 9–12** | your own address                         | Those need organiser rights, which Test Guy does not have    |

Nine other test guests exist for the directory, same pattern:
`dangomezwindshuttle+first_last@gmail.com`.

> ### ⚠️ On iPhone, an emailed link opens Safari — not the installed app
>
> Apple has never allowed a link in an email to open a Home Screen web app, and
> an installed iPhone app keeps **its own sign-in, separate from Safari's**.
>
> That is why sign-in uses a **code** rather than a link: a code is typed into
> whichever copy of the app asked for it, so it works wherever you are. And it
> is why the app tells iPhone users to **install first, then sign in** — doing
> it in that order means signing in once, in the place it needs to stick.
>
> **On Android none of this applies.**

---

---

## How to record results

Put a mark in the **Result** column and anything you noticed in **Notes**.

| Type this | Means                      |
| --------- | -------------------------- |
| works     | works as described         |
| `/`       | works, but something's off |
| `x`       | broken                     |
| `-`       | not tested                 |

All plain keyboard characters, so they're quick to type on a phone.

Rough notes are fine — half a sentence is enough to act on.

---

## Contents

| # | Section | What it covers |
|---|---|---|
| [1](#1-getting-in) | Getting in | Install to home screen |
| [1a](#1a-signing-in-with-a-code) | Signing in | A real code, emailed to you |
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
| [14](#14-design-and-general) | Design & general | Colours, fonts, layout |
| [15](#15-anything-else) | Anything else | Free notes |

> Sections 9–12 need organiser access — you'll see an **Organiser** button in
> the top bar. If you don't, send me your email address.

---

## 1. Getting in

> **Signed out to start.** Sections 1-8 are done as **Test Guy** -
> `dangomezwindshuttle+test_guy@gmail.com` - a plain attendee with no organiser
> rights.

Start signed out. If you are not, tap your avatar → **Sign out**.

| #   | Test                       | Expected                                                                      | Result | Notes                      |
| --- | -------------------------- | ----------------------------------------------------------------------------- | ------ | -------------------------- |
| 1.1 | Open the app link          | A **sign-in screen**, titled with the conference name                         | -      |                            |
| 1.2 | Test-mode notice           | A red box explains no email will really be sent                               | -      |                            |
| 1.3 | **Install-first guidance** | On iPhone, a purple box says "Add to your home screen first" and explains why | -      |                            |
| 1.4 | Add to home screen         | iPhone: **Share** → **Add to Home Screen**. Android: Chrome offers to install | -      |                            |
| 1.5 | Icon                       | Purple square, white ring, mint centre                                        | -      |                            |
| 1.6 | Open from the icon         | Full screen, no browser bar                                                   | -      |                            |
| 1.7 | Loading                    | A spinner, never a blank screen                                               | -      |                            |
> **Your note: signing out gave "this page couldn't load" (error 3812484992).**
> FIXED - please retest. The sign-out action cleared the session and then let
> the page re-render itself, but that page needs a signed-in user, so there was
> nothing to show. It sends you to the sign-in screen now, as you expected.

---

## 1a. Signing in with a code

**Do this from the installed app**, as an attendee would.

The code is genuine and Supabase verifies it exactly as it will on the day —
**only the email delivery is simulated**, so it appears on screen instead of in
an inbox.

| #    | Test                                                               | Expected                                                                            | Result | Notes |
| ---- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | ------ | ----- |
| 1a.1 | Enter `dangomezwindshuttle+test_guy@gmail.com` and tap **Sign in** | A six-digit code arrives by email (check spam once, then report it)                   | -      |       |
| 1a.2 | Numeric keypad                                                     | Tapping the code box brings up digits, not letters                                  | -      |       |
| 1a.3 | Type the code, tap **Sign in**                                     | You are signed in and land on **your profile**, ready to check it                   | -      |       |
| 1a.4 | Wrong code                                                         | "That code isn't right. Check it and try again, or send a new one."                 | -      |       |
| 1a.5 | Send a new code                                                    | "Send a new code" is throttled for 60 seconds, then issues a fresh one              | -      |       |
| 1a.6 | Unknown address                                                    | Try `nobody@example.com` — "No account for that address", and no account is created | -      |       |
| 1a.7 | Stays signed in                                                    | Close the app fully and reopen from the icon — still signed in                      | -      |       |
| 1a.8 | Install banner gone                                                | Inside the installed app, neither install box appears any more                      | -      |       |

> **The code is 8 digits, not 6** — that is this Supabase project's setting.
> Testing caught it: the form originally required exactly six, which would have
> left the Sign in button permanently disabled for every attendee.

> **Why a code and not a link:** on iPhone a link would open Safari and leave
> the installed app signed out. See
> [the README](README.md#1-email-for-sign-in--the-blocker).

---
## 2. Your profile

**Tap your avatar, top right.** Your profile already exists — you shouldn't
have to create anything.

| #    | Test                | Expected                                                           | Result | Notes                                                                                                                                            |
| ---- | ------------------- | ------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2.1  | Reach your profile  | Avatar top-right opens it directly                                 | -      |                                                                                                                                                  |
| 2.2  | It's prefilled      | Name, and for speakers title/company/bio/photo already there       | -      |                                                                                                                                                  |
| 2.3  | No email field      | Your email appears **nowhere** on the profile                      | -      |                                                                                                                                                  |
| 2.4  | "About you"         | A free-text box for a professional summary                         | -      |                                                                                                                                                  |
| 2.5  | LinkedIn helper     | "Open my LinkedIn ↗" opens *your* LinkedIn to copy the address     | -      |                                                                                                                                                  |
| 2.6  | Edit and save       | Change your role, save, reopen — the change stuck                  | -      |                                                                                                                                                  |
| 2.7  | Add a photo         | Appears within a few seconds, replacing your initials              | -      |                                                                                                                                                  |
| 2.8  | Remove the photo    | Falls back to initials on a coloured circle                        | -      |                                                                                                                                                  |
| 2.9  | Blank name refused  | Clearing your first name and saving is rejected                    | -      |                                                                                                                                                  |
| 2.10 | Leave the directory | "Remove me from the directory" - you stay signed in, just unlisted | -      |                                                                                                                                                  |

---

> **"If I remove myself from the directory, do I still have full
> functionality?"** Mostly, but not entirely. You stay signed in and can
> still read the feed, the programme and everyone else's profiles. What you
> lose is anything that needs a profile row: your starred My Schedule and
> your session ratings are deleted with it, push notifications stop, and new
> posts lose their author. Posts you already made stay up, but show no
> name. Filling the profile in again restores posting and starring — the
> stars and ratings themselves are gone for good.

---

## 3. The programme

| #    | Test                      | Expected                                                              | Result | Notes |
| ---- | ------------------------- | --------------------------------------------------------------------- | ------ | ----- |
| 3.1  | Open Program              | Main stage shows the full day, each session with its real talk title  | -      |       |
| 3.2  | Four tabs                 | Main stage · Demos · Open sessions · ★ My Schedule                    | -      |       |
| 3.3  | Day structure             | Registration, breaks, lunch, drinks appear among the sessions         | -      |       |
| 3.4  | Copenhagen time           | 08:30 registration, 11:50 lunch, 15:30 keynote                        | -      |       |
| 3.5  | Danish characters         | Ø, æ, å all render (Nørregaard, Bæk, Ødegård)                         | -      |       |
| 3.6  | Real speakers             | Actual speaker names, not invented ones                               | -      |       |
| 3.7  | **Finished sessions dim** | Anything already past fades back and is labelled "Finished"           | -      |       |
| 3.8  | Happening now             | The current session is outlined and badged "Now"                      | -      |       |
| 3.9  | **Open Sessions**         | Links out to a separate page — a notice explains it's published there | -      |       |
| 3.10 | No stars on breaks        | Lunch and breaks have no ☆ — you don't choose to attend lunch         | -      |       |

> ### "How can I test 3.7 and 3.8 when everything is in the future?"
>
> There is a button for it. **Organiser → Testing tools → 2. See a session in
> the Program.**
>
> - **Happening now** creates a Main stage session running from ten minutes ago
>   until fifty minutes from now. Open **Program** — it should be outlined and
>   badged **Now** (3.8).
> - **Already finished** creates one that ended an hour ago. It should be dimmed
>   and labelled **Finished** (3.7).
>
> Neither posts to the Feed, and **Clean up** in Testing tools removes both when
> you are done. You need to be signed in as yourself for this, not Test Guy — so
> if you are working in order, come back to 3.7 and 3.8 after section 9.

---

## 4. My Schedule

| #   | Test              | Expected                                                               | Result | Notes |
| --- | ----------------- | ---------------------------------------------------------------------- | ------ | ----- |
| 4.1 | Star a session    | The ☆ fills instantly, without a pause                                 | -      |       |
| 4.2 | Open My Schedule  | The starred session is listed                                          | -      |       |
| 4.3 | Star across rooms | Star something in Demos too — both appear in one list                  | -      |       |
| 4.4 | Chronological     | Sorted by time, not grouped by room                                    | -      |       |
| 4.5 | Room labelled     | Each entry says which room it's in                                     | -      |       |
| 4.6 | Unstar            | Tapping ★ again removes it from My Schedule                            | -      |       |
| 4.7 | Empty state       | With nothing starred, it explains what to do rather than sitting blank | -      |       |
| 4.8 | It persists       | Close the app, reopen — your stars are still there                     | -      |       |

---

## 5. Session pages

| #    | Test               | Expected                                                                | Result | Notes |
| ---- | ------------------ | ----------------------------------------------------------------------- | ------ | ----- |
| 5.1  | Open a session     | Tapping a session card opens its own page                               | -      |       |
| 5.2  | Details            | Time, room, title, and description if set                               | -      |       |
| 5.3  | Speaker card       | The speaker as a tappable card with photo and title                     | -      |       |
| 5.4  | Through to profile | Tapping it opens their full profile                                     | -      |       |
| 5.5  | Star from here     | A full-width **"Add to My Schedule"** button under the speaker card     | -      |       |
| 5.6  | Back goes back     | Returns where you came from — Program *or* My Schedule                  | -      |       |
| 5.7  | Rate this session  | Opens a modal: five stars, a comment, **Cancel and Send both visible**  | -      |       |
| 5.8  | Send a rating      | Confirms with a thank-you, then closes                                  | -      |       |
| 5.9  | Revise it          | Reopening shows your rating *and your comment*; changing it replaces it | -      |       |
| 5.10 | Anonymity stated   | The page says the rating is anonymous                                   | -      |       |

---

> ### Why no rating ever saved
>
> The table enforced "one rating per person per thing" with two *partial*
> database indexes. Postgres cannot work out which index an upsert means when
> the index only covers some rows, so every single save was rejected with
> `there is no unique or exclusion constraint matching the ON CONFLICT
> specification` — the error you saw. The ratings table had **zero rows in it**,
> which is how I confirmed it had never once worked, for anyone, for sessions
> or the app.
>
> One ordinary index replaces both, and revising a rating now updates it
> instead of adding a second. Worth a proper look tomorrow, since it is the
> only feature that was completely broken rather than merely awkward.

---

## 6. Networking

| #    | Test                          | Expected                                                            | Result | Notes |
| ---- | ----------------------------- | ------------------------------------------------------------------- | ------ | ----- |
| 6.1  | Open Networking               | The directory lists everyone with a profile                         | -      |       |
| 6.2  | You're listed                 | Find yourself                                                       | -      |       |
| 6.3  | Speaker photos                | Real speakers show their headshots                                  | -      |       |
| 6.4  | Filters                       | Everyone / Speakers / Guests, each with a count                     | -      |       |
| 6.5  | Search by name                | Type `werdelin`                                                     | -      |       |
| 6.6  | Search by company             | Type `zeronorth`                                                    | -      |       |
| 6.7  | **Danish, plain**             | `norgaard` (no ø) still finds Nørregaard                            | -      |       |
| 6.8  | **Danish, accented**          | `ødegård` also works                                                | -      |       |
| 6.9  | No results                    | A friendly message, not a blank screen                              | -      |       |
| 6.10 | Speaker profile               | Photo, title, company, **bio**, LinkedIn, their sessions            | -      |       |
| 6.11 | **No email shown**            | No email address anywhere on anyone's profile                       | -      |       |
| 6.12 | **Cancelled sessions hidden** | A cancelled session does **not** appear struck through on a profile | -      |       |

---

## 7. The feed

**Anyone can post now** — not just organisers.

| #    | Test                       | Expected                                                    | Result | Notes       |
| ---- | -------------------------- | ----------------------------------------------------------- | ------ | ----------- |
| 7.1  | Post button                | Visible to everyone, top right of the Feed                  | -      |             |
| 7.2  | Post text                  | Appears at the top of the feed with your name and photo     | -      |             |
| 7.3  | Character limit            | Counter caps at 500 and the button disables past it         | -      |             |
| 7.4  | **Post a photo**           | Pick one; it uploads and appears in the feed                | -      |             |
| 7.5  | **Post a link**            | Type `example.com`; it renders as a tappable link           | -      |             |
| 7.6  | Edit your own              | Edit, save — marked "edited"                                | -      |             |
| 7.7  | Delete your own            | Deleting returns you to the Feed                            | -      |             |
| 7.8  | **Organiser posts differ** | Organiser posts are tinted and badged "Organiser"           | -      |             |
| 7.9  | Alert style                | *Organisers:* "Mark as an alert" highlights it in red       | -      |             |
| 7.10 | Alerts are restricted      | A non-organiser sees no alert option                        | -      |             |
| 7.11 | **Moderation**             | *Organisers:* every post has a "Moderate" link to delete it | -      |             |
| 7.12 | Live update *(2 devices)*  | Post on one, it appears on the other **without refreshing** | -      |             |
| 7.13 | Empty post refused         | Submitting nothing is rejected                              | -      |             |
| 7.14 | **Restore is announced**   | Cancel a session, then restore it - the Feed says "Back on" | -      |             |
> **Your note: a cancelled session announced itself, a restored one did not.**
> FIXED - and you were right about why it matters: anyone who saw the
> cancellation would never learn it was back on, and would skip a session that
> was running. Restoring now posts "Back on: ...". Test 7.14 below covers it.


---

## 8. About and rating the app

| #   | Test              | Expected                                                                   | Result | Notes                                                 |
| --- | ----------------- | -------------------------------------------------------------------------- | ------ | ----------------------------------------------------- |
| 8.1 | Open About        | "About" in the top bar                                                     | -      |                                                       |
| 8.2 | The blurb         | Explains what the app is and that it's an experiment                       | -      |                                                       |
| 8.3 | Both names linked | Your name and Martin's link to your profiles                               | -      |                                                       |
| 8.4 | Rate this app     | Opens the same star modal, Cancel and Send both visible                    | -      |                                                       |
| 8.5 | Free text         | Labelled "We'd love to hear your feedback or suggestions — it's anonymous" | -      |                                                       |
| 8.6 | Submit            | Confirms and closes; your comment is still there if you reopen             | -      |                                                       |
| 8.7 | Revise            | Reopening shows your rating and lets you change it                         | -      |                                                       |

---

## 9. Organiser: schedule editing

> **Switch accounts here.** Before you start: check that Test Guy has **no
> Organiser button** on their profile - that is test 9.0 and it matters, because
> it proves an attendee cannot reach these tools. Then tap your avatar →
> **Sign out**, and sign back in as **your own address**, which does have
> organiser rights. Sections 9-14 all need it.

**Organiser → Edit the schedule.**

| #    | Test                 | Expected                                                                       | Result | Notes |
| ---- | -------------------- | ------------------------------------------------------------------------------ | ------ | ----- |
| 9.0  | **Test Guy has no access** | While signed in as Test Guy, no **Organiser** button appears on the profile, and opening `/admin` is refused | -      |       |
| 9.1  | Open it              | All rooms listed, grouped                                                      | -      |       |
| 9.2  | Add a session        | Room, title, speaker, start time - **and the Feed announces it**               | -      |       |
| 9.3  | End time follows     | Setting a start fills the end automatically; moving the start moves it         | -      |       |
| 9.4  | Room is a choice     | Three fixed rooms, no free-text box                                            | -      |       |
| 9.5  | **Description**      | A description field, shown on the session page                                 | -      |       |
| 9.6  | Move a session       | Change the time, leave "Tell attendees" ticked                                 | -      |       |
| 9.7  | Change announced     | The Feed shows what moved and what it was before                               | -      |       |
| 9.8  | **Typo stays quiet** | Changing one letter of a title posts **nothing** — deliberate                  | -      |       |
| 9.9  | Opt out              | Unticking "Tell attendees" posts nothing                                       | -      |       |
| 9.10 | **Room clash warns** | Two sessions in one room at one time warns, naming the clash — but still saves | -      |       |
| 9.11 | Cancel               | Stays visible struck through in the Program                                    | -      |       |
| 9.12 | Restore              | Puts it back                                                                   | -      |       |
| 9.13 | Delete               | Removes it entirely                                                            | -      |       |

---

## 10. Organiser: slides

| #    | Test                | Expected                                                                                                 | Result | Notes |
| ---- | ------------------- | -------------------------------------------------------------------------------------------------------- | ------ | ----- |
| 10.1 | Slides field        | The session form has a "Slides URL (PDF)" box                                                            | -      |       |
| 10.2 | Before it ends      | Add a URL to a **future** session. Its page says slides will appear once it's finished — no download yet | -      |       |
| 10.3 | **After it ends**   | Add a URL to a session already finished. Within a minute the Feed says the slides are available          | -      |       |
| 10.4 | Download appears    | That session's page now shows a download button                                                          | -      |       |
| 10.5 | **No URL, no post** | A finished session **without** a URL never announces anything                                            | -      |       |
| 10.6 | No double-posting   | It announces once, not repeatedly                                                                        | -      |       |

> ### How to test the slides, step by step
>
> You need one session that has already finished. Five minutes.
>
> 1. **Organiser → Edit the schedule.** Pick any session and add a *Slides URL* —
>    any PDF link will do, e.g. `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`.
>    Leave its time alone for now and save.
> 2. **Test 10.2:** open that session's page. It should say slides will appear
>    once it has finished, with **no** download button.
> 3. Now you need a finished session. **Organiser → Testing tools → 2. See a
>    session in the Program → Already finished** makes one in a single tap; add
>    the *Slides URL* to that. (Or edit the times by hand as above, untick
>    *Tell attendees*, and let the announcer do the rest.)
> 4. **Test 10.3:** wait a minute, then open the Feed. It should say the slides
>    are available, badged as automatic. (Impatient? **Organiser → Testing
>    tools → Run announcer now**.)
> 5. **Test 10.4:** open the session page again — the download button is there.
> 6. **Test 10.6:** run the announcer twice more. Still one post, not three.
> 7. **Test 10.5:** pick a *different* finished session with **no** slides URL
>    and run the announcer. It must say nothing at all about that one.
>
> Then put the times back.

---

## 11. Organiser: feedback review

**Organiser → Ratings & feedback.**

| #    | Test               | Expected                                                  | Result | Notes |
| ---- | ------------------ | --------------------------------------------------------- | ------ | ----- |
| 11.1 | Open it            | Averages for the app and for sessions                     | -      |       |
| 11.2 | Two-column table   | Stars beside the comment                                  | -      |       |
| 11.3 | Your ratings       | The ones you left in 5.8 and 8.6 appear                   | -      |       |
| 11.4 | Grouped by session | Session ratings grouped under each session, busiest first | -      |       |
| 11.5 | **Anonymous**      | No name anywhere — you can't tell who said what           | -      |       |
When I rated the app and submitted some feedback, logged in as test guy on the website in a desktop browser, I got the error message: 'there is no unique or exclusion constraint matching the ON CONFLICT specification' - what does that mean?


---

## 12. Organiser: announcements and notifications

⚠️ **Do this from the home-screen app**, not the browser — on iPhone
notifications only work once installed.

| #     | Test                         | Expected                                                                  | Result | Notes |
| ----- | ---------------------------- | ------------------------------------------------------------------------- | ------ | ----- |
| 12.1  | Turn on notifications        | Avatar → scroll down → allow                                              | -      |       |
| 12.2  | Confirms                     | "Notifications are on"                                                    | -      |       |
| 12.3  | Test notification            | Organiser -> Testing tools -> Send a test - it arrives                    | -      |       |
| 12.4  | Tapping opens the app        |                                                                           | -      |       |
| 12.5  | Create a test session        | Testing tools → **+3 min**, listed as "waiting"                           | -      |       |
| 12.6  | Wait a minute                | Reload — it says "announced ✓"                                            | -      |       |
| 12.7  | Correct time                 | The time shown is Copenhagen time, not two hours out                      | -      |       |
| 12.8  | In the Feed                  | "Next up at HH:MM …" appears, badged as automatic                         | -      |       |
| 12.9  | Notification arrived         |                                                                           | -      |       |
| 12.10 | **No double-posting**        | Tap "Run announcer now" three times - still only one post                 | -      |       |
| 12.11 | Not-yet-due                  | **+30 min**, run it — nothing posts, too far out                          | -      |       |
| 12.12 | **Kill switch**              | Organiser → turn announcements off; create +3 min and run — nothing posts | -      |       |
| 12.13 | Back on                      | Toggling back on, it posts again                                          | -      |       |
| 12.14 | Buttons show they're pressed | Every organiser button shows a spinner while working                      | -      |       |
| 12.15 | Clean up                     | "Remove test sessions" clears them *(check the Feed first)*               | -      |       |

---

## 14. Design and general

| #    | Test                 | Expected                                                    | Result | Notes |
| ---- | -------------------- | ----------------------------------------------------------- | ------ | ----- |
| 14.1 | **Light throughout** | No dark mode anywhere, even with your phone in dark mode    | -      |       |
| 14.2 | Brand purple         | Buttons and links are `#4309FF`                             | -      |       |
| 14.3 | Readable             | Text is high contrast and comfortable in daylight           | -      |       |
| 14.4 | Inter font           | Clean sans-serif throughout                                 | -      |       |
| 14.5 | App name             | **AIMC-CC** in the top bar and on the home-screen icon      | -      |       |
| 14.6 | Full name            | Spelled out on the Feed and the sign-in screen              | -      |       |
| 14.7 | Tap targets          | Nothing fiddly to hit one-handed                            | -      |       |
| 14.8 | No overflow          | Nothing spills off the side, and no modal button is cut off | -      |       |
| 14.9 | Speed                | Screens open quickly on mobile data                         | -      |       |

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

- **No email arrives when signing in.** Check spam first. If it is genuinely
  missing, the Magic Link template may be missing `{{ .Token }}`, or the
  Supabase rate limit for sending emails has been hit.
- **Open Sessions has no listing.** It links out; the URL is still to come.
- **Attendees aren't loaded yet.** Ten test guests stand in until the
  checkin.no export arrives. They are the only accounts with a `+` in the
  address, so they are easy to remove.
- **Two sessions have no title or description.** Sofie Hvitved and Xander
  Evangelidis have no page in the speaker deck, so those two read "Session —
  title to be confirmed" rather than carrying an invented title. Every other
  session has its real title and description.
- **The running order is derived, not given.** The two programme CSVs are
  availability forms — which slots each speaker *could* do. Speakers, times,
  rooms and titles are real; who ends up in which slot is solved, so expect
  the real order to differ.
- **One speaker is not on the programme.** Thomas Martinsen gave no
  availability in either CSV and there was no slot left over.
- **The closing keynote is really three talks, and the draft splits them.**
  Henrik Werdelin's description in the deck says the block runs Henrik →
  Sigurd Bæk → Casper Willer as one arc. Neither Sigurd nor Casper returned
  an availability form, so the solver could only drop them into the last two
  free demo slots (14:10 and 14:40). Worth merging into the 15:30 keynote
  block by hand — see section 9, editing the schedule.
- **The icon is a placeholder** until brand assets arrive.
- **On iPhone the email link opens Safari, not the app.** An Apple limitation
  with no workaround. The app now tells people to install before signing in,
  which avoids the double sign-in it would otherwise cause. Android is fine.
