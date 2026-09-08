# Analytics & Metrics

**[PostHog](https://posthog.com) on EU cloud.** This is an EU event with EU attendees, and PostHog keeps the data in Frankfurt, which removes the data-transfer question instead of answering it. It's also built for product metrics, so the HEART signals map onto it directly and the dashboard takes minutes rather than a day.

It's configured so **no cookie banner is needed**: anonymous visitors aren't profiled, autocapture and session recording are off, IP addresses aren't stored, and the only identifier sent is an opaque user id — never a name or address.

---

## Metrics framework

**[Assets/metrics-framework.csv](Assets/metrics-framework.csv)** — the HEART framework, ready to import into Google Sheets. Nineteen rows across Happiness, Engagement, Adoption, Retention and Task Success, each with the goal, what's tracked, the formula, and a stated hypothesis so a number can be read as good or bad rather than merely recorded. Results and Learnings columns are left empty to fill in afterwards.

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

All event names are defined in [`lib/analytics.ts`](lib/analytics.ts). The app fires these events deliberately, and nothing else is tracked.

### Events

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
| `session_page_opened`             | Session page opened                                                                                             | -                                     |
| `directory_search`                | Search performed                                                                                                | length, results                       |
| `linkedin_tap`                    | LinkedIn or company link tapped                                                                                 | -                                     |
| `company_link_tapped`             | LinkedIn or company link tapped                                                                                 | -                                     |
| `product_link_tapped`             | Product link tapped on a demo session                                                                           | -                                     |
| `open_space_board_tapped`         | Board link tapped                                                                                               | before_schedule (bool)                |
| `$pageview`                       | Repeat sessions per user                                                                                        | path                                  |
| `program_opened (track=main`      | Cohort: signed in AND saved a profile AND viewed all three room tabs AND opened a session AND starred a session | -                                     |
| `open)`                           | Cohort: signed in AND saved a profile AND viewed all three room tabs AND opened a session AND starred a session | -                                     |
| `profile_view`                    | Cohort: the aha cohort AND viewed a profile AND opened the feed                                                 | -                                     |

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

### Not firing

- `notification_received` / `notification_opened` - would need the service
  worker to post back to the page; deliberately left until after the event.
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

