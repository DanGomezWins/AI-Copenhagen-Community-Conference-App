# Build plan — sponsor updates, 2 September

Event **Thursday 10 September**. Real programme and speaker data arrives
**8–9 September**. That leaves roughly **six working days to build**, with the
last two reserved for loading real data and rehearsing.

Ordered so the most structural work lands first and the riskiest thing that can
slip is last.

---

## Decisions taken

| | |
|---|---|
| **Sign-in** | Email links to the app; person enters their address; magic link arrives. Two steps, but the credential never travels in a bulk email. |
| **Profiles** | Pre-created and fully populated from the attendee export. Nobody signs *up* — first sign-in lands on a finished profile. |
| **Feed moderation** | Posts go live instantly. Organiser and attendee posts look different. Organisers can delete any post. |
| **Analytics** | PostHog, EU cloud. |
| **Open Sessions** | Tab stays, shows a "published separately" note until the external URL exists. |

---

## Blocked on inputs

| Needed | For | Who |
|---|---|---|
| **Attendee export with email addresses** | Pre-creating accounts and profiles. The speaker CSV has no emails, and nothing works without them. | checkin.no export |
| **Open Sessions page URL** | The external link | Whoever is building it |
| **Speaker slide URLs (PDF)** | Slide auto-posting | Martin — see his note |
| **Session descriptions** | Session detail pages | In the speakers PDF; I'll extract |
| **Real programme** | Everything | 8–9 Sep |

Nothing here blocks starting. All of it is data loaded at the end.

---

## Phase 1 — Design system and rename

Everything later is built in the new look, so this goes first.

- Light theme only; dark mode removed
- Palette: **`#4309FF`** primary, **`#99FCA0`** positive/success,
  **`#FF5555`** alert/destructive. Neutrals rebuilt for high contrast.
- **Inter** throughout, self-hosted so it doesn't depend on Google's CDN
- Rename to **AIMC-CC** — header, browser tab, home-screen icon, manifest, docs
- Contrast checked against WCAG AA. `#99FCA0` is a light mint and is unreadable
  as text on white, so it becomes a background/accent only, never body text.

## Phase 2 — Profiles and sign-in

- **Remove self-signup.** No profile creation flow; profiles already exist.
- **Import script**: attendee export → auth account + populated profile.
  Idempotent, so it can be re-run as the list firms up.
- **Speaker enrichment**: the 17 from the CSV get title, organisation,
  LinkedIn, bio and topic (extracted from the PDF) and their photo uploaded.
- **Profile fields become**: photo, full name, role, company, speaker tag,
  professional profile *(speakers)*, sessions *(speakers)*.
  **Email is removed** from the profile entirely, per the sponsor.
- **People can still edit their own profile** — correcting a wrong title or
  swapping a photo shouldn't need us.
- **Unknown email at sign-in**: not a dead end. They get in with a minimal
  profile and a note to see an organiser. A transferred ticket at the door
  cannot be a locked door.

## Phase 3 — Program

- **My Schedule.** Star any session; starred sessions appear in one
  chronological list across all rooms, as a fourth option beside the three
  tracks.
- **Session detail pages.** Tapping a session card anywhere opens it: times,
  room, speaker, description, slides when available, and **Rate this session**.
- **Open Sessions** becomes an external link. The scanner and its routes are
  **disabled, not deleted** — one flag flips them back if the plan changes.
- **Past sessions dim** as the day moves. Already partly there; extended so a
  finished session is unmistakably finished.
- **Bug**: cancelled sessions no longer appear struck through on profile pages
  — they're hidden there entirely.

## Phase 4 — Feed opened up

- **Anyone can post**: text, one image, one link
- **Own posts editable and deletable**; organisers can delete anything
- **Organiser posts visually distinct** — badge and accent, so official
  information is separable at a glance
- **Character limit 500**, with a live counter. Long enough for a real message,
  short enough that the feed stays scannable on a phone.
- Images downscaled in the browser before upload, as profile photos already are

## Phase 5 — Slides

- `slides_url` on each session, PDF only
- Shown on the session page and under the speaker's sessions
- **Auto-post once a session's end time passes — but only if a URL exists.**
  Rides on the existing announcer, which already has duplicate protection and
  the kill switch.

## Phase 6 — About, ratings and feedback

- **About page**: what this is, both names linked to profiles, and the feedback
  invitation
- **Rate this app** — 5 stars plus an optional anonymous comment
- **Rate this session** — same component, per session
- Both stored and readable as a two-column table in the organiser area

## Phase 7 — Analytics

- **PostHog EU**, with events instrumented against the HEART framework
- **`metrics-framework.csv`** for Google Sheets, matching the columns you
  specified: HEART section · App section · Goal · Signals · Metric ·
  Hypotheses · Results · Learnings. Modelled on your CathNow sheet.
- **Dashboard built in PostHog** rather than in the app — same information,
  none of the build time, and it can be explored beyond what we planned.

## Phase 8 — Documentation

README and the guided tour updated for everything above.

---

## Risks

**The sequencing risk is real.** Six days for eight phases is achievable but
has no slack. If something has to give, Phases 6 and 7 are the ones that can
land after the event — ratings and analytics are valuable but nothing on the
day depends on them. Phases 1–5 are what attendees actually touch.

**Late data.** Real programme and speakers arriving 24–48 hours before means
the import scripts have to work first time. They'll be written and rehearsed
against dummy data shaped exactly like the real thing, so the switch is a
re-run, not a build.

**Opening the feed** is the one change with a downside that can't be undone in
the moment. Organisers can delete anything, but a bad post is visible until
someone notices. Worth Martin knowing before the day rather than after.
