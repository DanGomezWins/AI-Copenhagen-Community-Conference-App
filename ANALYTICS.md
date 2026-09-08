# Analytics & Metrics

**[PostHog](https://posthog.com) on EU cloud.** This is an EU event with EU attendees, and PostHog keeps the data in Frankfurt, which removes the data-transfer question instead of answering it. It's also built for product metrics, so the HEART signals map onto it directly and the dashboard takes minutes rather than a day.

It's configured so **no cookie banner is needed**: anonymous visitors aren't profiled, autocapture and session recording are off, IP addresses aren't stored, and the only identifier sent is an opaque user id — never a name or address.

---

## Metrics framework

**[Assets/metrics-framework.csv](Assets/metrics-framework.csv)** — the source of truth, ready to import into Google Sheets. One row per dashboard tile across Happiness, Adoption, Engagement, Task success, Retention and the two aha-moment cohorts. Each carries the tile name, the goal, the signal, the event and its properties, the formula, and a stated hypothesis so a number can be read as good or bad rather than merely recorded. Results and Learnings are left empty to fill in afterwards.

---

## Setting up PostHog

The CSV is the plan; PostHog is where the numbers come from. There is no "import a CSV and get a dashboard" button — PostHog builds insights from events the app sends, not from rows in a spreadsheet. So the CSV stays the reference document, and you build the matching insights once. It takes about half an hour.

**1. Create the project.** Sign up at [eu.posthog.com](https://eu.posthog.com) — the **EU** region specifically, which is what keeps the data in Frankfurt. Create a project called `AIMC-CC`.

**2. Put the key in the environment.** Project settings → *Project API key*. Add both of these to `.env.local` and to Railway → Variables, then redeploy:

```
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

**3. Set up for analysis after the event.** You'll use one PostHog project for everything — test data and real event data together. After the event, filter each insight by date to show only the event window itself, excluding your testing clicks.

**4. Send some events.** Open the app and click around. Within a minute or two they appear under *Activity* → *Live events*. Nothing can be charted until PostHog has seen an event at least once, so do this before step 5.

**5. Build the insights.** Every metric in the CSV is one of three shapes, and each maps onto a PostHog insight type:

| Shape in the CSV | PostHog insight | How to build it |
|---|---|---|
| A count ("feed views per attendee") | **Trends** | Pick the event, set *Chart type* to Trends, and under the event choose **Unique users** or **Total count** to match the formula |
| A ratio of one step to another ("completed sign-ins / started sign-ins") | **Funnel** | Add the two events in order — e.g. `sign_in_started` then `sign_in_completed`. The conversion rate PostHog shows *is* the metric |
| "Attendees who did X at all" | **Trends**, Unique users | Pick the event, set Unique users, and read it against the signed-in total |

**6. Name each insight after its CSV row**, e.g. *Task Success — Sign-in completion*. That is what keeps the spreadsheet and the dashboard describing the same thing. Save each one to a dashboard called **HEART**.

**7. Read it against the hypotheses.** The *Hypotheses* column already says what counts as good or bad, so on the day after the event you fill in *Results* and *Learnings* rather than staring at a number wondering whether 34% is good. When reviewing each insight, filter by date to show only the event window — the app's timestamp will separate test data from real event data.

**Two metrics are not in PostHog.** Average star ratings for the app and for sessions live in the database, because the ratings themselves do. Read those from **Organiser → Ratings & feedback** in the app, not from the dashboard.

---

## Events

All event names are defined in [`lib/analytics.ts`](lib/analytics.ts). The app
fires these deliberately, and nothing else is tracked - no autocapture, no
session recording.

Every event below fires in the app today. The table is derived from
[Assets/metrics-framework.csv](Assets/metrics-framework.csv), which is the
source of truth - the spreadsheet, this file and the PostHog dashboard use the
same names for the same things, so a tile can be traced back to a line of code
without translation.

| Event                             | Signal                                                                                                          | Properties                            |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `app_rating_submitted`            | App rating submitted                                                                                            | star_rating (1-5), has_comment (bool) |
| `session_rating_submitted`        | Session rating submitted                                                                                        | star_rating (1-5), has_comment (bool) |
| `sign_in_email_requested`         | Code requested, then entered successfully                                                                       | -                                     |
| `sign_in_started`                 | Code requested, then entered successfully                                                                       | -                                     |
| `sign_in_completed`               | Code requested, then entered successfully                                                                       | -                                     |
| `home_screen_launch`              | App launched from the Home Screen                                                                               | -                                     |
| `notification_permission_granted` | Push permission granted                                                                                         | -                                     |
| `profile_edited`                  | Profile saved                                                                                                   | -                                     |
| `feed_opened`                     | Feed opened; attendee posts                                                                                     | -                                     |
| `attendee_post_created`           | Feed opened; attendee posts                                                                                     | -                                     |
| `session_starred`                 | Session starred                                                                                                 | sessionId                             |
| `program_opened`                  | Programme tab opened                                                                                            | track (main, demos, open, mine)       |
| `session_page_opened`             | Session page opened                                                                                             | track (main, demos, open)             |
| `directory_search`                | Search performed                                                                                                | length, results                       |
| `linkedin_tap`                    | LinkedIn or company link tapped                                                                                 | -                                     |
| `company_link_tapped`             | LinkedIn or company link tapped                                                                                 | -                                     |
| `product_link_tapped`             | Product link tapped on a demo session                                                                           | -                                     |
| `open_space_board_tapped`         | Board link tapped                                                                                               | before_schedule (bool)                |
| `notification_opened`             | Notification tapped                                                                                             | path                                  |
| `$pageview`                       | Repeat sessions per user                                                                                        | path                                  |
| `program_opened (track=main`      | Cohort: signed in AND saved a profile AND viewed all three room tabs AND opened a session AND starred a session | -                                     |
| `open)`                           | Cohort: signed in AND saved a profile AND viewed all three room tabs AND opened a session AND starred a session | -                                     |
| `profile_view`                    | Cohort: the aha cohort AND viewed a profile AND opened the feed                                                 | -                                     |

## Verifying the tracking

One pass through the app, in the order somebody would actually use it. Open
PostHog → **Activity → Live events** on a second screen and watch them arrive.

**Check the properties, not just the event names.** Both faults found so far
were an event firing correctly while missing a property a tile divided by - the
tile read "no matching events" and looked like nobody had done the thing. Click
an event in the list to expand its properties.

Do this in the **installed app**, not a browser tab, or step 1 cannot fire.

| #   | What you do                              | Event                             | Properties to check                                                |
| --- | ---------------------------------------- | --------------------------------- | ------------------------------------------------------------------ |
| 1   | Open the app from the Home Screen icon   | `home_screen_launch`              | none - it firing at all is the signal                              |
| 2   | Type your email, tap **Email me a code** | `sign_in_started`                 | none                                                               |
| 3   | ...the request succeeds                  | `sign_in_email_requested`         | none - fires only if the send was accepted                         |
| 4   | Enter the code, tap **Sign in**          | `sign_in_completed`               | none                                                               |
| 5   | Turn on notifications from your profile  | `notification_permission_granted` | none - only fires the first time you grant                         |
| 6   | Edit anything on your profile, **Save**  | `profile_edited`                  | none - fires on submit                                             |
| 7   | You land on the Program                  | `program_opened`                  | **`track` = `main`**                                               |
| 8   | Tap **Demos**                            | `program_opened`                  | **`track` = `demos`**                                              |
| 9   | Tap **Open sessions**                    | `program_opened`                  | **`track` = `open`**                                               |
| 10  | Tap **Propose and vote on topics**       | `open_space_board_tapped`         | `before_schedule` (true until the agenda is pushed)                |
| 11  | Back to Demos, open any session          | `session_page_opened`             | **`track` = `demos`** - the product-link tile divides by this      |
| 12  | Tap ☆ **Add to My Schedule**             | `session_starred`                 | `sessionId`                                                        |
| 13  | Tap the company link on that demo        | `product_link_tapped`             | none - fires as the page backgrounds                               |
| 14  | Tap **★ My Schedule**                    | `program_opened`                  | **`track` = `mine`**                                               |
| 15  | **Networking**, open any profile         | `profile_view`                    | none when opened from the list                                     |
| 16  | Tap their **LinkedIn**                   | `linkedin_tap`                    | none                                                               |
| 17  | Tap their **company**                    | `company_link_tapped`             | none                                                               |
| 18  | Back to Networking, search a name        | `directory_search`                | `length`, `results` - fires ~1s after you stop typing              |
| 19  | Open a profile **from those results**    | `profile_view`                    | **`from_search` = `true`** - only set on this path                 |
| 20  | Tap **Feed**                             | `feed_opened`                     | none                                                               |
| 21  | Post something                           | `attendee_post_created`           | none                                                               |
| 22  | Open a session, **Rate this session**    | `session_rating_submitted`        | **`star_rating`** (1-5), **`has_comment`** (true if you typed one) |
| 23  | **About** → **Rate this app**            | `app_rating_submitted`            | **`star_rating`**, **`has_comment`**                               |
| 24  | Send yourself a test push, tap it        | `notification_opened`             | `path` - the screen it opened                                      |

Expect **20 distinct event types** across roughly 25 events. Steps 7, 8, 9 and
14 are the same event four times with a different `track` - if any shows the
wrong value, or none, the room-level tiles break.

### If something does not appear

- **Nothing at all** - PostHog batches. Give it a minute, and check you are not
  on a network blocking analytics.
- **The event but not the property** - the fault is in the app, not the
  dashboard. Run `npm run check:analytics`, which compares what the code sends
  against what the tiles expect.
- **`product_link_tapped` missing** - it fires as the app is backgrounded by the
  in-app browser. It is sent with `send_instantly` and `sendBeacon` for exactly
  that reason; if it is lost, that is the thing to look at.
- **`home_screen_launch` missing** - you are in a browser tab, not the installed
  app.

Once every row checks out, the tiles are reading real data and the numbers in
the write-up can be trusted.

### Aha moment and super users

Both are **PostHog cohorts**, not events the app fires. A cohort can be
redefined after the fact and applies retroactively to data already collected,
where an event only counts from the moment it ships.

**Aha moment** - signed in, saved a profile, viewed all three room tabs, opened
a session, and starred at least one:

```
sign_in_completed
  AND profile_edited
  AND program_opened where track = main
  AND program_opened where track = demos
  AND program_opened where track = open
  AND session_page_opened
  AND session_starred
```

**Super user** - everything above, plus engaged with other people:

```
(aha moment cohort)
  AND profile_view
  AND feed_opened
```

Both now exist in PostHog: [Aha moment](https://eu.posthog.com/project/265578/cohorts/234827)
and [Super user](https://eu.posthog.com/project/265578/cohorts/234828). Every
condition is anchored to `2026-09-10 08:00` with `explicit_datetime`, so the
weeks of build-and-test activity cannot count towards either. They read **0
until the day** - that is correct, not a fault.

### The day boundary

Everything captured before 10 September is test data from building the app: 691
events across five people, most of them one person. Two things keep it out of
the write-up.

**Annotations** mark the boundary on every chart - a 🚦 at 08:00 on 10
September and a 🏁 at 15:30 when the last session ends. These are project-scoped,
so they appear on any insight with `showAnnotations` on, which is all of them.

**A dashboard-level date filter** is the real exclusion. Set `date_from` to
`2026-09-10` on the HEART dashboard on the morning of the event: dashboard
filters override each tile's own range, so it is one change rather than
nineteen. It is deliberately **not** set in advance, because it would blank
every tile during the last rounds of testing.

### Why the tiles are numbers, not graphs

The event is one day. Every tile was built with `interval: day`, which on a
single-day event draws a line graph with one point on it - and a ratio with a
large denominator is invisible on an axis anyway. So:

- **Ratios** render as `BoldNumber` with `aggregationAxisFormat:
  percentage_scaled` - one figure, e.g. 4 taps out of 100 opens reads as 4%.
- **Averages and counts** render as `BoldNumber`, numeric.
- **Only where the shape through the day is the point** does a chart survive -
  rooms explored and the Open Space board - and those were moved to
  `interval: hour` so there is something to see.
- **Return visits is hourly too, and measures the day rather than days.** It is
  a one-day event, so returning means coming back later the same morning, not
  the next day. The tile is cumulative hourly stickiness - people active in N
  or more separate hours - which is the metric the framework always specified.
  It only reads correctly with the dashboard date filter set to the event day,
  since "distinct hours" over a wider range would count hours across days.
- `metricShowChange` is off everywhere: there is no previous period to compare
  a one-day event against.

### Not firing

- `notification_received` - not trackable in any honest way. The push service
  reports what it accepted, never what a phone chose to display, so a
  "delivered" count would be a guess. Opens are measured against people who
  enabled notifications instead.
- `session_start` - PostHog already derives sessions from pageviews.
- `scan_*` and `slides_*` - defined in [lib/analytics.ts](lib/analytics.ts) but
  dormant along with the features they belong to. Not in the framework, because
  a dashboard row that can never move is noise on the day.

---

## Event flow in code

- **Server actions** (`app/actions/*.ts`) — fire events after database operations succeed
- **Client components** (`components/*.tsx`, `app/**/page.tsx`) — track user interactions with `track(EVENTS.eventName, properties)`
- **Tracking utilities** (`lib/track.ts`) — wraps PostHog capture calls and checks if PostHog is loaded
- **Analytics configuration** (`components/Analytics.tsx`) — initializes PostHog with EU settings and privacy-first defaults

The tracking is optimistic: events fire immediately on the client, giving real-time feedback while the user is still using the app. If the capture fails, PostHog's retry logic handles it.

