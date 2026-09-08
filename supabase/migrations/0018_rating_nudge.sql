-- Asks the people who starred a session how it was, once it has finished.
--
-- Tracked per session rather than per person: the nudge goes out in one pass
-- when the session ends, and the column is claimed the same way announced_at
-- is, so two overlapping announcer ticks cannot both send it.

alter table public.sessions
  add column if not exists rating_nudge_sent_at timestamptz;

-- A kill switch of its own, separate from auto_announce. On the day an
-- organiser may want the schedule notices while deciding the rating prompts
-- are one buzz too many - that should not require a deploy, or the loss of
-- both.
alter table public.app_settings
  add column if not exists rating_nudge boolean not null default true;
