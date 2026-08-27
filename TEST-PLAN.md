# AIC Info — Test Plan

**App:** https://aic-info-production.up.railway.app
**Tester:** Daniel

---

## 📍 WHERE YOU ARE — round 3

**Round 2 done:** all sections attempted. Most rows pass and are marked `✅` — skip those.
**Round 3:** the **33 rows marked `🔁`**, listed as a tick-off checklist below.

### 🔴 DO THIS FIRST — nothing about notifications can work until you do

**The VAPID keys were never added to Railway.** That's the single cause of
7.3, 7.4, 7.5, and it cascaded into 7.6, 7.7 and 7.14. Not a bug — a missing
config step from when I generated the keys.

1. Open **`railway-vars.txt`** in the project folder
2. Copy all of it
3. Railway → your service → **Variables** → **Raw Editor** → paste → **Save**

Then check it worked — this now reports push config, which it didn't before:

```bash
curl.exe https://aic-info-production.up.railway.app/api/health
```

All seven values must read `true`. `/admin → Testing tools` also now shows a red
**"Not configured"** box if they're still missing, so you can't get caught out again.

### Retest these

| # | Was | Now |
|---|---|---|
| **7.3, 7.4, 7.5** | "Notifications aren't configured yet" | Add the VAPID vars above. The error message now explains what's actually wrong instead of dead-ending. |
| **7.10** | Times two hours behind; no press feedback | **Fixed.** The label used the server's clock (UTC on Railway) instead of Copenhagen. Every button in the organiser area now shows a spinner while it works. |
| **7.13** | Feed didn't show the auto post | **Couldn't reproduce** — re-verified end to end and the post lands correctly. Most likely the cleanup step removed it before you looked. The testing page now **lists the automatic posts it created**, so you can see them without leaving the page, and cleanup asks for confirmation first. |
| **6.12** | "daniel gomez-windshuttle" didn't match "Daniel Gomez-Windshuttle" | **Fixed, and your suggestion adopted.** All names are now stored and shown in Title Case. I also backfilled what was already in the database — including that exact row. Matching was already case-insensitive; the display wasn't. |
| **3.2** | Couldn't test — profile already existed | **/me** now has **"Remove me from the directory"**. You stay signed in, you just stop being listed — so you can run the first-run flow properly. Worth having anyway: a directory publishing your employer and LinkedIn should let you leave it. |

### Also new this round

| Change | Where |
|---|---|
| **Title is now "AI Meetup Copenhagen Community Conference #1"** | Login, Feed, browser tab, home-screen icon. The sticky top bar shortens it on a narrow phone so it doesn't crowd out your avatar. |
| **Link to the Meetup event page** | Under the title on the Feed and on the login screen |
| Title Case names everywhere | Profiles, schedule editor, and scanner output |
| Press feedback on buttons | Every organiser action button |
| Confirmation before destructive actions | Cleanup, and removing your profile |

> ### ⚠️ Still worth knowing — 6.25
> Any signed-in attendee can add, edit or cancel **Open Sessions**. Main stage
> and Demos stay organiser-only, and only organisers can delete. That's the
> trade for letting people scan their own board entry.

---

---

## ✅ ROUND 3 CHECKLIST — every row you gave input on

**33 rows.** Each is marked `🔁` in the tables below and its **Result is blank**,
so anything still empty is still to do. Your original notes are untouched.

Tick these off as you go.

### Fixed from your feedback — confirm it's right now

- [ ] **2.3** Launch shows a spinner, not a white screen
- [ ] **3.6** Profile photo large and centred, above the name
- [ ] **4.2** No room subtext under the track buttons
- [ ] **4.6** Back from a speaker's profile returns to **Program**
- [ ] **5.14** The word "LinkedIn" is itself a link
- [ ] **6.12** Names show in Title Case, and your open session links to you
- [ ] **6.13** End time defaults to +25 min and follows when you move the start
- [ ] **6.14** Clashing room warns you on save
- [ ] **6.33** Correction box placeholder starts with "e.g."
- [ ] **6.35** Board needs start / end / title / name — no room
- [ ] **6.37** Booker's name is a tappable link
- [ ] **7.10** Times are Copenhagen time, buttons show a spinner when pressed
- [ ] **7.13** Testing page lists the automatic posts it created

### Now unblocked — these need the VAPID vars live first

- [ ] **7.3** "Notifications are on" after allowing
- [ ] **7.4** Test notification arrives
- [ ] **7.5** Subscriber count says at least 1
- [ ] **7.6** Tapping the notification opens the app
- [ ] **7.7** Notification arrives with the phone locked
- [ ] **7.8** Turning notifications off stops them
- [ ] **7.14** Announcer notification arrives

### Never tested

- [ ] **3.1** Avatar top-right reaches your profile
- [ ] **3.2** First-run flow *(use "Remove me from the directory" on /me first)*
- [ ] **4.8** Back from a profile to the Program
- [ ] **5.13** Open someone's profile from the directory
- [ ] **5.15** A speaker's sessions are listed on their profile
- [ ] **7.9** Testing tools opens
- [ ] **7.15** Running the announcer repeatedly still posts only once
- [ ] **7.19** Cleanup *(check the feed **before** you do this)*

### Android — optional

- [ ] **8.1** Loads and signs in
- [ ] **8.2** Install prompt
- [ ] **8.3** Notifications work **without** installing
- [ ] **8.4** Receives a notification
- [ ] **8.5** Layout holds up

---

## Status key

`🔁` in the **#** column = **recheck this one**. Its Result is blank; your original
note is still in the Notes column so you can see what you flagged.
`✅` = passed and unchanged since — skip it.

---

## Before you start

| # | Do this | Why |
|---|---|---|
| 0.1 | **Add the VAPID vars to Railway** (above) | Section 7 cannot pass without it |
| 0.2 | **Delete and re-add the home screen icon** | The app name and icon label changed |
| 0.3 | Second device handy if possible | A few tests need two screens |

**On Android:** everything works, and push works *better* than on iOS (no
home-screen requirement). Section 8 is a short optional pass.

---

## 1. Getting in

| #   | Test                     | How                                                                   | Result | Notes |
| --- | ------------------------ | --------------------------------------------------------------------- | ------ | ----- |
| 1.1 | App loads                | Open the URL. You should land on a sign-in screen.                    | ✅ |       |
| 1.2 | Test-mode banner shows   | An amber "Test mode" box says no email will be sent.                  | ✅ |       |
| 1.3 | Sign in                  | Type your email, tap **Sign in**. You should go straight in.          | ✅ |       |
| 1.4 | Lands somewhere sensible | First time → profile setup. After that → the Feed.                    | ✅ |       |
| 1.5 | Stays signed in          | Close the app fully, reopen it. You should not have to sign in again. | ✅ |       |

> **Why there's no email:** Supabase's built-in mail only allows a couple of messages
> an hour, which makes testing impossible. This is a real sign-in — real account, real
> permissions — it just skips the email. It gets removed when Resend is set up.

---

## 2. Install it to your home screen

Do this early — several later tests (notifications especially) only work once installed.

| #   | Test               | How                                                         | Result | Notes                                                                                                                                                                                                                                            |
| --- | ------------------ | ----------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2.1 | Add to Home Screen | Safari → **Share** → **Add to Home Screen**                 | ✅ |                                                                                                                                                                                                                                                  |
| 2.2 | Icon looks right   | Blue ring on dark. Placeholder until you send brand assets. | ✅ |                                                                                                                                                                                                                                                  |
| 🔁 2.3 | Opens full-screen  | Launch from the home screen — no Safari address bar         |  | However the screen is just white while the PWA seems to be loading. Is there any way to have a preloader or some animation, or even just a static message that lets the user know the app is loading instead of them staring at a white screen?  |
| 2.4 | Still signed in    | Opening from the icon should keep you signed in             | ✅ |                                                                                                                                                                                                                                                  |

---

## 3. Your profile

**Where it lives:** tap **your avatar in the top-right corner** of any screen.
That's new — previously there was no direct route and you had to find yourself in
the directory. If you have no profile yet it says **Add profile** instead.

| #      | Test                   | How                                                                                                       | Result | Notes                                                                                                                                                                                                                                           |
| ------ | ---------------------- | --------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔁 3.1 | Reach your profile     | Go to **Networking**, tap through to `/me`                                                                |  |                                                                                                                                                                                                                                                 |
| 🔁 3.2 | Fill it in             | First/last name, Speaker or Guest, company, role                                                          |  | need to test after my profile data is deleted                                                                                                                                                                                                   |
| 3.3 | LinkedIn helper        | Tap **Open my LinkedIn ↗** next to the label. Should open *your* profile. Copy the URL, come back, paste. | ✅      |                                                                                                                                                                                                                                                 |
| 3.4 | Form survives the trip | Anything you'd already typed should still be there                                                        | ✅      |                                                                                                                                                                                                                                                 |
| 3.5 | Save                   | Tap **Save profile**. Confirmation appears.                                                               | ✅      |                                                                                                                                                                                                                                                 |
| 🔁 3.6 | Add a photo            | Tap **Add a photo**, pick one. Should appear within a few seconds.                                        |  | Would be great if the profile photo is larger, though, so perhaps have it occupy a larger portion of the visible screen. I'm thinking have it centre-aligned, almost filling the width, and having it above the name and other profile details. |
| 3.7 | Change the photo       | Replace it. The new one should show, not the old.                                                         | ✅      |                                                                                                                                                                                                                                                 |
| 3.8 | Remove the photo       | Tap **Remove**. Falls back to your initials on a colour.                                                  | ✅      |                                                                                                                                                                                                                                                 |
| 3.9 | Edit again             | Change your role, save, reopen `/me` — change persisted                                                   | ✅      |                                                                                                                                                                                                                                                 |
| 3.10 | Blank name rejected    | Clear your first name and save. Should refuse, not save empty.                                            | ✅      |                                                                                                                                                                                                                                                 |

---

## 4. Program

| #   | Test                      | How                                                                              | Result | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --- | ------------------------- | -------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 4.1 | Program loads             | Tap **Program**. Main stage shows a full day.                                    | ✅ |                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 🔁 4.2 | Switch tracks             | Tap **Demos**, then **Open sessions**                                            |  | I don't think we need the little text underneath each of the stage buttons, which says "Auditorium Room 1" or "Room 2". The main buttons for main stage demos and open sessions are enough.                                                                                                                                                                                                                                                                              |
| 4.3 | Day structure reads right | Registration, breaks, lunch, networking appear as thin dividers, not as sessions | ✅ |                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 4.4 | Times are Copenhagen time | 08:30 registration, 11:50 lunch, 15:30 keynote                                   | ✅ |                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 4.5 | Danish names render       | Ø, æ, å all display correctly                                                    | ✅ |                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 🔁 4.6 | **Speaker names link**    | Tap a speaker's name — opens their profile                                       |  | However, when I click through to a speaker's profile at the top left of their profile screen, the back arrow wants to take me back to networking. It would be cool if that back button can dynamically change so that it would go back to programme rather than back to the networking tab. Since the PWA is full-screen, we don't actually have a back button for the browser that we can use to go back where we came from reliably, only if it's not too complicated. |
| 4.7 | Non-registered speaker    | A speaker with no profile shows as plain text, not a dead link                   | ✅ |                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 🔁 4.8 | Back works                | From a profile, get back to the Program                                          |  |                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

---

## 5. Networking

| #    | Test                           | How                                                      | Result | Notes                                                                               |
| ---- | ------------------------------ | -------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------- |
| 5.1 | Directory loads                | Tap **Networking**. ~16 people listed.                   | ✅ |                                                                                     |
| 5.2 | You're in it                   | Find yourself                                            | ✅ |                                                                                     |
| 5.3 | Counts look right              | Everyone / Speakers / Guests each show a number          | ✅ |                                                                                     |
| 5.4 | Filter: Speakers               | Only speakers, each badged                               | ✅ |                                                                                     |
| 5.5 | Filter: Guests                 | Only non-speakers                                        | ✅ |                                                                                     |
| 5.6 | Search by name                 | Type `astrid`                                            | ✅ |                                                                                     |
| 5.7 | Search by company              | Type `novo`                                              | ✅ |                                                                                     |
| 5.8 | Search by role                 | Type `engineer`                                          | ✅ |                                                                                     |
| 5.9 | **Danish spelling — plain**    | Type `norgaard` (no ø). Should still find Nørgaard-Bech. | ✅ |                                                                                     |
| 5.10 | **Danish spelling — accented** | Type `ødegård`. Should also work.                        | ✅ |                                                                                     |
| 5.11 | `aa` vs `a`                    | Try both `aagaard` and `agaard`                          | ✅ |                                                                                     |
| 5.12 | No results                     | Type `zzzzz`. Friendly message, not a blank screen.      | ✅ |                                                                                     |
| 🔁 5.13 | Open a profile                 | Tap someone. Photo/initials, role, company.              |  |                                                                                     |
| 🔁 5.14 | LinkedIn opens                 | Tap LinkedIn on a profile with one                       |  | Would be good if the LinkedIn text is also an active link as well as the open link. |
| 🔁 5.15 | Speaker's sessions             | Open a speaker — their talk is listed                    |  | Can't test this,                                                                    |

---

## 6. Organiser tools

You're an organiser, so **/admin** works for you. A normal attendee gets a 404 —
they can't even tell it exists.

Is it possible to have an Admin button in the main nav, only visible to admins?

### 6a. Posting updates

| #    | Test                            | How                                                                                                | Result | Notes |
| ---- | ------------------------------- | -------------------------------------------------------------------------------------------------- | ------ | ----- |
| 6.1 | Post button visible             | On the Feed, a **Post** button top-right                                                           | ✅ |       |
| 6.2 | Write a post                    | Type something, tap **Post to everyone**                                                           | ✅ |       |
| 6.3 | Appears immediately             | You land on the Feed and it's at the top                                                           | ✅ |       |
| 6.4 | Your name shows                 | Post is attributed to you                                                                          | ✅ |       |
| 6.5 | Track tag                       | Post another tagged **Demos**. Shows a "Demos" badge.                                              | ✅ |       |
| 6.6 | Alert style                     | Post one with **Mark as an alert** ticked. Amber.                                                  | ✅ |       |
| 6.7 | Edit a post                     | Tap **Edit** under a post, change it, save. Marked "edited".                                       | ✅ |       |
| 6.8 | **Delete returns to Feed**      | Edit a post → **Delete this update**. Should land on the **Feed**, not the compose screen.         | ✅ |       |
| 6.9 | Character limit                 | Try pasting something enormous. Counter caps at 1000.                                              | ✅ |       |
| 6.10 | Empty post refused              | Submit with nothing typed                                                                          | ✅ |       |
| 6.11 | **Live update** *(two devices)* | Open the Feed on device B. Post from device A. B should show "1 new update" **without reloading**. | ✅ |       |

### 6b. Manual schedule editor

**When you'd use it:** a speaker cancels, a session moves room, the day slips. It's
also the fallback if the photo scanner misreads something. **Admin → Edit the schedule.**

| #       | Test                      | How                                                                                             | Result | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------- | ------------------------- | ----------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔁 6.12 | Open it                   | **/admin** → **Edit the schedule**. All three tracks listed.                                    |  | When I edited an Open session and corrected the spelling of the name of the booker (daniel.gomez-windshuttle to daniel gomez-windshuttle) it didn't match daniel gomez-windshuttle to the existing Daniel Gomez-Windshuttle but it should have, and then auto generated a link to that speaker in the Open Sessions speaker to the profile of Daniel Gomez-Windshuttle.<br>The matching should not be case sensitive and all entered names in sessions and profiles should be saved & displayed in Title Case (each word captialized). |
| 🔁 6.13 | Add a session             | **Add** → pick Demos, title, speaker, 13:15, save                                               |  | would be nice if the end time selector could default to 20 mins after start time                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 🔁 6.14 | It appears                | Program → Demos → your new session is there                                                     |  | Although it's possible to create a session in a room that conflicts with an existing session for that room, the user should be notified. I don't think we need to make it any more complicated than that by giving the user the option to replace or move the other session, but just notify them so they know it's an issue.                                                                                                                                                                                                          |
| 6.15 | **Move a session**        | Edit one, change the time, leave **Tell attendees** ticked, save                                | ✅      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 6.16 | Change was announced      | Feed shows *"Schedule change: … is now at HH:MM (was HH:MM)"*                                   | ✅ |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 6.17 | **Typo fix stays quiet**  | Edit a session, change only a letter in the title, save. **No feed post** — this is deliberate. | ✅ |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 6.18 | Change the room           | Edit, change room, save. Feed says *"now in X (was Y)"*.                                        | ✅      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 6.19 | Opt out of announcing     | Edit, change the time, **untick** Tell attendees, save. No feed post.                           | ✅ |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 6.20 | Cancel a session          | Tap **Cancel** on a row                                                                         | ✅      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 6.21 | Cancelled looks cancelled | Program shows it struck through with a red badge — not vanished                                 | ✅      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 6.22 | Restore it                | Tap **Restore**                                                                                 | ✅      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 6.23 | Delete a session          | Delete the one you added in 6.13. Gone from the Program.                                        | ✅      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 6.24 | End before start refused  | Set end time earlier than start. Should refuse.                                                 | ✅      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

### 6c. The photo scanner (Open Sessions)

**What it's for:** the Open Sessions board is handwritten and changes all day.
Photograph it, and the app reads it and updates the schedule.

**Anyone can use this now**, not just organisers — reach it from **Program → Open
sessions → "Scan"**, or `/scan`. Organisers also have it in the admin hub.

**Board format** (changed from your notes — no room column):

```
OPEN SESSIONS

9:30  - 9:55   AI in Government        Ida Munk-Jespersen
9.55  - 10:20  Prompt Engineering      Gustav Hillerod
10:20 - 10:45  Hiring for AI Teams     Signe Holm          <- cross this one out
2:20pm- 2:45pm Worst Failure Stories   Daniel Gomez-Windshuttle
```

Each line: **start, end, title, full name**. Put **your own name** on one line —
that's how 6.37 gets tested. Mix the time formats (`9.55`, `2:20pm`) and cross one
line out deliberately; that's what a real board looks like.

| #       | Test                            | How                                                                                                                           | Result | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6.25 | Open the scanner                | **/admin** → **Scan the board**                                                                                               | ✅ |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 6.26 | Take a photo                    | Tap the box, photograph your paper                                                                                            | ✅      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 6.27 | It reads it                     | After a few seconds you get a review screen                                                                                   | ✅      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 6.28 | Times normalised                | `9.55` → 09:55, `2:20pm` → 14:20                                                                                              | ✅      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 6.29 | **Crossed-out line dropped**    | The struck-through session is *not* included                                                                                  | ✅      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 6.30 | It says why                     | A remark at the top mentions the crossed-out row                                                                              | ✅ |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 6.31 | Counts shown                    | "N new" in green at the top                                                                                                   | ✅      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 6.32 | Low confidence flagged          | Anything it struggled with is amber/red with a note                                                                           | ✅      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 🔁 6.33 | **Correct it in plain English** | In the box, type e.g. *"The 9:30 one is in Room 2, not Room 3"* → **Apply correction**                                        |  | start the text in the field with 'e.g. __'                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 6.34 | Correction applied              | That row updates; **everything else stays the same**                                                                          | ✅      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 🔁 6.35 | Multiple corrections at once    | Try *"Change the 10:20 room to Room 2 and the speaker to Ida Hansen"*                                                         |  | Since all the Open Sesssions are in the same room, no need to specify rooms. We just need to make it clear that the open sessions on the board need:<br>- start time<br>- end time<br>- Title<br>- Booker Full Name (must match profile name)                                                                                                                                                                                                                                                                                                                                                                        |
| 6.36 | Publish                         | Tap **Publish to attendees**                                                                                                  | ✅      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 🔁 6.37 | Program updated                 | Program → Open sessions → your sessions are live                                                                              |  | However I created an open session and I listed myself, Daniel Gomez-Windshuttle, as the booker. When I view this new session in the programme for open sessions, it did not have a hyperlink for Daniel Gomez-Windshuttle, Daniel Gomez-Windshuttle, to view my profile. It should, because that exact name exists as one of the attendees. Assuming that people booking a session for the open sessions use the same name as they are using in their profile, it should match that name with an existing profile. If, for some reason, they haven't created a profile yet, it should prompt them to make a profile. |
| 6.38 | Feed was told                   | Feed shows *"Open Sessions schedule updated — N added"*                                                                       | ✅      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 6.39 | **Rescan detects changes**      | Edit your paper (change a time), photograph again. Should show **changed**, not duplicate everything.                         | ✅      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 6.40 | Removal → cancelled             | Cross out another line and rescan. Should show **removed**; after publishing it's struck through in the Program, not deleted. | ✅      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 6.41 | Discard works                   | Scan, then **Discard and photograph again**. Nothing published.                                                               | ✅ |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 6.42 | Bad photo handled               | Photograph something blank or blurry. Should say so, not crash.                                                               | ✅      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

### 6d. Who can post

| #    | Test              | How                                         | Result | Notes |
| ---- | ----------------- | ------------------------------------------- | ------ | ----- |
| 6.43 | Open it           | **/admin** → **Who can post**               | ✅ |       |
| 6.44 | You're listed     | Marked "You", with no Remove button         | ✅ |       |
| 6.45 | Add someone       | Add any email + note. Confirmation appears. | ✅ |       |
| 6.46 | Remove them       | Remove the one you just added               | ✅ |       |
| 6.47 | Bad email refused | Try `notanemail`                            | ✅ |       |
| 6.48 | Duplicate refused | Add your own email again                    | ✅ |       |

---

## 7. Notifications and the auto-announcer

Do this **from the home-screen app**, not Safari. On iPhone, notifications only work once installed.

### 7a. Turning them on

| #   | Test              | How                                                                   | Result  | Notes                                      |
| --- | ----------------- | --------------------------------------------------------------------- | ------- | ------------------------------------------ |
| 7.1 | Prompt appears    | Open `/me`. Below the form: "Get notified about changes".             | ✅ |                                            |
| 7.2 | Turn on           | Tap it, allow when iOS asks                                           | ✅ |                                            |
| 🔁 7.3 | Confirms          | Box changes to "Notifications are on"                                 |  | says 'Notifications aren't configured yet' |
| 🔁 7.4 | Test notification | **/admin → Testing tools → Send a test notification**. Should arrive. |  |                                            |
| 🔁 7.5 | Subscriber count  | Same page says at least 1 subscribed                                  |  | i couldn't subsribe because 7.3 failed     |
| 🔁 7.6 | Tapping opens app | Tap the notification                                                  |  |                                            |
| 🔁 7.7 | Post triggers one | Lock your phone, post an update from a laptop. Notification arrives.  |  |                                            |
| 🔁 7.8 | Turn off          | Tap **Turn off** on `/me`, confirm no more arrive                     |  |                                            |

### 7b. The auto-announcer

**What it does:** posts *"Next up: …"* five minutes before every session, automatically.
**Why it needs a test tool:** the real programme is all on 10 September, so nothing in
it can reach the announcer's window until the day itself.

| #    | Test                    | How                                                                                                  | Result     | Notes                                                                                                                                                                                                                                                                                                                                                                                                 |     |
| ---- | ----------------------- | ---------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| 🔁 7.9 | Open testing tools      | **/admin → Testing tools**                                                                           |  |                                                                                                                                                                                                                                                                                                                                                                                                       |     |
| 🔁 7.10 | Create a test session   | Tap **+3 min**. Appears below as "waiting".                                                          |  | But was slow, not instant. Also there seems to be a two-hour time difference because the correct time should have been listed as 17:01, and it's displayed as 15:01. The same with several of the other announcer tests. They are two hours behind.<br>When I press the 'Run an Answer Now' button (and it seems most buttons) there is no feedback to confirm I pressed it. It needs a 'press state' |     |
| 7.11 | **Wait ~1 minute**      | It ticks every minute. Reload the page.                                                              | ✅ |                                                                                                                                                                                                                                                                                                                                                                                                       |     |
| 7.12 | It announced            | Row now says "announced ✓"                                                                           | ✅ |                                                                                                                                                                                                                                                                                                                                                                                                       |     |
| 🔁 7.13 | Feed has it             | Feed shows *"Next up at HH:MM: Announcer test — Test Speaker (Room 3 · Open sessions)"*              |  |                                                                                                                                                                                                                                                                                                                                                                                                       |     |
| 🔁 7.14 | Notification arrived    | If notifications are on, one should have come through                                                |  |                                                                                                                                                                                                                                                                                                                                                                                                       |     |
| 🔁 7.15 | **No double-post**      | Tap **Run announcer now** two or three times. Still only **one** post.                               |  |                                                                                                                                                                                                                                                                                                                                                                                                       |     |
| 7.16 | Not-yet-due stays quiet | Tap **+30 min**. Run the announcer. Should *not* announce — too far out.                             | ✅ |                                                                                                                                                                                                                                                                                                                                                                                                       |     |
| 7.17 | **Kill switch**         | **/admin** → **Turn off** automatic announcements. Create **+3 min**, run announcer. Nothing posted. | ✅ |                                                                                                                                                                                                                                                                                                                                                                                                       |     |
| 7.18 | Turn it back on         | Toggle back. Run announcer. Now it posts.                                                            | ✅ |                                                                                                                                                                                                                                                                                                                                                                                                       |     |
| 🔁 7.19 | Clean up                | **Remove test sessions and their posts**. Feed and Program back to normal.                           |  |                                                                                                                                                                                                                                                                                                                                                                                                       |     |

---

## 8. Android (optional — only if you have a device)

Everything works on Android; push is *more* reliable than iOS. Worth a quick pass.

| # | Test | How | Result | Notes |
|---|---|---|---|---|
| 🔁 8.1 | Loads and signs in | Chrome on Android |  | |
| 🔁 8.2 | Install prompt | Chrome usually offers "Install app" |  | |
| 🔁 8.3 | Notifications **without installing** | Works in the browser on Android — unlike iOS |  | |
| 🔁 8.4 | Receives a notification | Use **Send a test notification** |  | |
| 🔁 8.5 | Layout holds up | Program and Networking look right |  | |

---

## 9. Anything else

Free space. Confusing wording, awkward taps, slow screens, anything that felt wrong:

-
-
-

---

## Before the event — not test cases, reminders

- [ ] **Set up Resend** and turn off `ENABLE_DEV_SIGNIN` in Railway — without this, nobody can sign in on the day
- [ ] Delete `/app/dev/signin/route.ts`
- [ ] Import the real programme (replaces the dummy one)
- [ ] Import the attendee list
- [ ] Clear dummy people: `node scripts/seed-people.mjs --clear`
- [ ] Clear dummy programme: `node scripts/seed-program.mjs --clear`
- [ ] Add Martin as an organiser, and any room hosts
- [ ] Replace the placeholder icons with real branding
- [ ] Confirm Railway app-sleeping is **off**
