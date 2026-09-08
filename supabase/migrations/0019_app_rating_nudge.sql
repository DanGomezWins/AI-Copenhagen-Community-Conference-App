-- Asks everyone who has not rated the app how it went, once the day is over.
--
-- Unlike the per-session prompt, this fires once for the whole conference, so
-- the claim lives on app_settings rather than on a row per session. Stamped
-- conditionally the same way, so two overlapping announcer ticks cannot both
-- send it.
alter table public.app_settings
  add column if not exists app_rating_nudge_sent_at timestamptz;

-- Its own switch, separate from the per-session rating prompt.
--
-- The two are not interchangeable: twelve session prompts could plausibly be
-- one buzz too many, while this one fires once and is the only thing that
-- produces the app's headline happiness number. Sharing a switch would mean
-- turning off the noisy half also silently discards the valuable half.
alter table public.app_settings
  add column if not exists app_rating_nudge boolean not null default true;
