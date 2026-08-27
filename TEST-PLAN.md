# AIC Info — Test Plan

**App:** https://aic-info-production.up.railway.app
**Tester:** Daniel · **Date started:** ______

Work top to bottom. It follows a real user's journey: arrive → sign in → set up →
browse → then the organiser tools.

**How to record results:** fill in the Result column as you go.
`✅` works · `⚠️` works but odd · `❌` broken · `–` didn't test

Add anything you noticed in **Notes**. Rough is fine — half a sentence is enough
for me to act on.

---

## Before you start

| # | Do this | Why |
|---|---|---|
| 0.1 | Open the app on your **iPhone**, in Safari | Everything below assumes a phone, not a laptop |
| 0.2 | Have a second device or a laptop handy if possible | A few tests need two screens at once. Skip those if not. |

**On Android:** everything works, and push notifications work *better* than on iOS
(no home-screen requirement, more reliable delivery). There's nothing Android-specific
to fix. Test on iOS first because it's the constrained platform — if it works there,
Android follows. Section 8 has a short Android pass if you have a device.

---

## 1. Getting in

| # | Test | How | Result | Notes |
|---|---|---|---|---|
| 1.1 | App loads | Open the URL. You should land on a sign-in screen. | | |
| 1.2 | Test-mode banner shows | An amber "Test mode" box says no email will be sent. | | |
| 1.3 | Sign in | Type your email, tap **Sign in**. You should go straight in. | | |
| 1.4 | Lands somewhere sensible | First time → profile setup. After that → the Feed. | | |
| 1.5 | Stays signed in | Close the app fully, reopen it. You should not have to sign in again. | | |

> **Why there's no email:** Supabase's built-in mail only allows a couple of messages
> an hour, which makes testing impossible. This is a real sign-in — real account, real
> permissions — it just skips the email. It gets removed when Resend is set up.

---

## 2. Install it to your home screen

Do this early — several later tests (notifications especially) only work once installed.

| # | Test | How | Result | Notes |
|---|---|---|---|---|
| 2.1 | Add to Home Screen | Safari → **Share** → **Add to Home Screen** | | |
| 2.2 | Icon looks right | Blue ring on dark. Placeholder until you send brand assets. | | |
| 2.3 | Opens full-screen | Launch from the home screen — no Safari address bar | | |
| 2.4 | Still signed in | Opening from the icon should keep you signed in | | |

---

## 3. Your profile

**Where it lives:** there's no Profile tab. Get there by **Networking → the banner at
the top** ("You're not listed yet → Add my profile"), or once you have a profile, find
yourself in the directory and tap **Edit my profile** at the bottom. Direct URL: `/me`.

| # | Test | How | Result | Notes |
|---|---|---|---|---|
| 3.1 | Reach your profile | Go to **Networking**, tap through to `/me` | | |
| 3.2 | Fill it in | First/last name, Speaker or Guest, company, role | | |
| 3.3 | LinkedIn helper | Tap **Open my LinkedIn ↗** next to the label. Should open *your* profile. Copy the URL, come back, paste. | | |
| 3.4 | Form survives the trip | Anything you'd already typed should still be there | | |
| 3.5 | Save | Tap **Save profile**. Confirmation appears. | | |
| 3.6 | Add a photo | Tap **Add a photo**, pick one. Should appear within a few seconds. | | |
| 3.7 | Change the photo | Replace it. The new one should show, not the old. | | |
| 3.8 | Remove the photo | Tap **Remove**. Falls back to your initials on a colour. | | |
| 3.9 | Edit again | Change your role, save, reopen `/me` — change persisted | | |
| 3.10 | Blank name rejected | Clear your first name and save. Should refuse, not save empty. | | |

---

## 4. Program

| # | Test | How | Result | Notes |
|---|---|---|---|---|
| 4.1 | Program loads | Tap **Program**. Main stage shows a full day. | | |
| 4.2 | Switch tracks | Tap **Demos**, then **Open sessions** | | |
| 4.3 | Day structure reads right | Registration, breaks, lunch, networking appear as thin dividers, not as sessions | | |
| 4.4 | Times are Copenhagen time | 08:30 registration, 11:50 lunch, 15:30 keynote | | |
| 4.5 | Danish names render | Ø, æ, å all display correctly | | |
| 4.6 | **Speaker names link** | Tap a speaker's name — opens their profile | | |
| 4.7 | Non-registered speaker | A speaker with no profile shows as plain text, not a dead link | | |
| 4.8 | Back works | From a profile, get back to the Program | | |

---

## 5. Networking

| # | Test | How | Result | Notes |
|---|---|---|---|---|
| 5.1 | Directory loads | Tap **Networking**. ~16 people listed. | | |
| 5.2 | You're in it | Find yourself | | |
| 5.3 | Counts look right | Everyone / Speakers / Guests each show a number | | |
| 5.4 | Filter: Speakers | Only speakers, each badged | | |
| 5.5 | Filter: Guests | Only non-speakers | | |
| 5.6 | Search by name | Type `astrid` | | |
| 5.7 | Search by company | Type `novo` | | |
| 5.8 | Search by role | Type `engineer` | | |
| 5.9 | **Danish spelling — plain** | Type `norgaard` (no ø). Should still find Nørgaard-Bech. | | |
| 5.10 | **Danish spelling — accented** | Type `ødegård`. Should also work. | | |
| 5.11 | `aa` vs `a` | Try both `aagaard` and `agaard` | | |
| 5.12 | No results | Type `zzzzz`. Friendly message, not a blank screen. | | |
| 5.13 | Open a profile | Tap someone. Photo/initials, role, company. | | |
| 5.14 | LinkedIn opens | Tap LinkedIn on a profile with one | | |
| 5.15 | Speaker's sessions | Open a speaker — their talk is listed | | |

---

## 6. Organiser tools

You're an organiser, so **/admin** works for you. A normal attendee gets a 404 —
they can't even tell it exists.

### 6a. Posting updates

| # | Test | How | Result | Notes |
|---|---|---|---|---|
| 6.1 | Post button visible | On the Feed, a **Post** button top-right | | |
| 6.2 | Write a post | Type something, tap **Post to everyone** | | |
| 6.3 | Appears immediately | You land on the Feed and it's at the top | | |
| 6.4 | Your name shows | Post is attributed to you | | |
| 6.5 | Track tag | Post another tagged **Demos**. Shows a "Demos" badge. | | |
| 6.6 | Alert style | Post one with **Mark as an alert** ticked. Amber. | | |
| 6.7 | Edit a post | Tap **Edit** under a post, change it, save. Marked "edited". | | |
| 6.8 | **Delete returns to Feed** | Edit a post → **Delete this update**. Should land on the **Feed**, not the compose screen. | | |
| 6.9 | Character limit | Try pasting something enormous. Counter caps at 1000. | | |
| 6.10 | Empty post refused | Submit with nothing typed | | |
| 6.11 | **Live update** *(two devices)* | Open the Feed on device B. Post from device A. B should show "1 new update" **without reloading**. | | |

### 6b. Manual schedule editor

**When you'd use it:** a speaker cancels, a session moves room, the day slips. It's
also the fallback if the photo scanner misreads something. **Admin → Edit the schedule.**

| # | Test | How | Result | Notes |
|---|---|---|---|---|
| 6.12 | Open it | **/admin** → **Edit the schedule**. All three tracks listed. | | |
| 6.13 | Add a session | **Add** → pick Demos, title, speaker, 13:15, save | | |
| 6.14 | It appears | Program → Demos → your new session is there | | |
| 6.15 | **Move a session** | Edit one, change the time, leave **Tell attendees** ticked, save | | |
| 6.16 | Change was announced | Feed shows *"Schedule change: … is now at HH:MM (was HH:MM)"* | | |
| 6.17 | **Typo fix stays quiet** | Edit a session, change only a letter in the title, save. **No feed post** — this is deliberate. | | |
| 6.18 | Change the room | Edit, change room, save. Feed says *"now in X (was Y)"*. | | |
| 6.19 | Opt out of announcing | Edit, change the time, **untick** Tell attendees, save. No feed post. | | |
| 6.20 | Cancel a session | Tap **Cancel** on a row | | |
| 6.21 | Cancelled looks cancelled | Program shows it struck through with a red badge — not vanished | | |
| 6.22 | Restore it | Tap **Restore** | | |
| 6.23 | Delete a session | Delete the one you added in 6.13. Gone from the Program. | | |
| 6.24 | End before start refused | Set end time earlier than start. Should refuse. | | |

### 6c. The photo scanner (Open Sessions)

**What it's for:** the Open Sessions board is handwritten and changes all day.
Photograph it, and the app reads it and updates the schedule.

**To test it, first make a fake board.** On paper, write 4–5 lines like:

```
OPEN SESSIONS

9:30   AI in Government      Ida Munk-Jespersen   R3
9.55   Prompt Engineering    Gustav Hillerod      R3
10:20  Hiring for AI Teams   Signe Holm           R3      <- cross this one out
2:20pm Worst Failure Stories Nanna Lovgren        R3
```

Mix the time formats deliberately (`9.55`, `2:20pm`) and cross one line out —
that's what a real board looks like, and it's what this needs to cope with.

| # | Test | How | Result | Notes |
|---|---|---|---|---|
| 6.25 | Open the scanner | **/admin** → **Scan the board** | | |
| 6.26 | Take a photo | Tap the box, photograph your paper | | |
| 6.27 | It reads it | After a few seconds you get a review screen | | |
| 6.28 | Times normalised | `9.55` → 09:55, `2:20pm` → 14:20 | | |
| 6.29 | **Crossed-out line dropped** | The struck-through session is *not* included | | |
| 6.30 | It says why | A remark at the top mentions the crossed-out row | | |
| 6.31 | Counts shown | "N new" in green at the top | | |
| 6.32 | Low confidence flagged | Anything it struggled with is amber/red with a note | | |
| 6.33 | **Correct it in plain English** | In the box, type e.g. *"The 9:30 one is in Room 2, not Room 3"* → **Apply correction** | | |
| 6.34 | Correction applied | That row updates; **everything else stays the same** | | |
| 6.35 | Multiple corrections at once | Try *"Change the 10:20 room to Room 2 and the speaker to Ida Hansen"* | | |
| 6.36 | Publish | Tap **Publish to attendees** | | |
| 6.37 | Program updated | Program → Open sessions → your sessions are live | | |
| 6.38 | Feed was told | Feed shows *"Open Sessions schedule updated — N added"* | | |
| 6.39 | **Rescan detects changes** | Edit your paper (change a time), photograph again. Should show **changed**, not duplicate everything. | | |
| 6.40 | Removal → cancelled | Cross out another line and rescan. Should show **removed**; after publishing it's struck through in the Program, not deleted. | | |
| 6.41 | Discard works | Scan, then **Discard and photograph again**. Nothing published. | | |
| 6.42 | Bad photo handled | Photograph something blank or blurry. Should say so, not crash. | | |

### 6d. Who can post

| # | Test | How | Result | Notes |
|---|---|---|---|---|
| 6.43 | Open it | **/admin** → **Who can post** | | |
| 6.44 | You're listed | Marked "You", with no Remove button | | |
| 6.45 | Add someone | Add any email + note. Confirmation appears. | | |
| 6.46 | Remove them | Remove the one you just added | | |
| 6.47 | Bad email refused | Try `notanemail` | | |
| 6.48 | Duplicate refused | Add your own email again | | |

---

## 7. Notifications and the auto-announcer

Do this **from the home-screen app**, not Safari. On iPhone, notifications only work once installed.

### 7a. Turning them on

| # | Test | How | Result | Notes |
|---|---|---|---|---|
| 7.1 | Prompt appears | Open `/me`. Below the form: "Get notified about changes". | | |
| 7.2 | Turn on | Tap it, allow when iOS asks | | |
| 7.3 | Confirms | Box changes to "Notifications are on" | | |
| 7.4 | Test notification | **/admin → Testing tools → Send a test notification**. Should arrive. | | |
| 7.5 | Subscriber count | Same page says at least 1 subscribed | | |
| 7.6 | Tapping opens app | Tap the notification | | |
| 7.7 | Post triggers one | Lock your phone, post an update from a laptop. Notification arrives. | | |
| 7.8 | Turn off | Tap **Turn off** on `/me`, confirm no more arrive | | |

### 7b. The auto-announcer

**What it does:** posts *"Next up: …"* five minutes before every session, automatically.
**Why it needs a test tool:** the real programme is all on 10 September, so nothing in
it can reach the announcer's window until the day itself.

| # | Test | How | Result | Notes |
|---|---|---|---|---|
| 7.9 | Open testing tools | **/admin → Testing tools** | | |
| 7.10 | Create a test session | Tap **+3 min**. Appears below as "waiting". | | |
| 7.11 | **Wait ~1 minute** | It ticks every minute. Reload the page. | | |
| 7.12 | It announced | Row now says "announced ✓" | | |
| 7.13 | Feed has it | Feed shows *"Next up at HH:MM: Announcer test — Test Speaker (Room 3 · Open sessions)"* | | |
| 7.14 | Notification arrived | If notifications are on, one should have come through | | |
| 7.15 | **No double-post** | Tap **Run announcer now** two or three times. Still only **one** post. | | |
| 7.16 | Not-yet-due stays quiet | Tap **+30 min**. Run the announcer. Should *not* announce — too far out. | | |
| 7.17 | **Kill switch** | **/admin** → **Turn off** automatic announcements. Create **+3 min**, run announcer. Nothing posted. | | |
| 7.18 | Turn it back on | Toggle back. Run announcer. Now it posts. | | |
| 7.19 | Clean up | **Remove test sessions and their posts**. Feed and Program back to normal. | | |

---

## 8. Android (optional — only if you have a device)

Everything works on Android; push is *more* reliable than iOS. Worth a quick pass.

| # | Test | How | Result | Notes |
|---|---|---|---|---|
| 8.1 | Loads and signs in | Chrome on Android | | |
| 8.2 | Install prompt | Chrome usually offers "Install app" | | |
| 8.3 | Notifications **without installing** | Works in the browser on Android — unlike iOS | | |
| 8.4 | Receives a notification | Use **Send a test notification** | | |
| 8.5 | Layout holds up | Program and Networking look right | | |

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
