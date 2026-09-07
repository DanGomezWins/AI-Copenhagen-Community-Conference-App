-- Four additions, all attendee-facing, all optional so nothing breaks while
-- the real values are still being collected.

-- 1. Where a speaker works, as a link. Shown on their profile.
alter table public.profiles
  add column if not exists company_url text;

-- 2. The product a demo is about. Demo talks are pitches; the first thing
--    someone wants after watching one is the thing itself.
alter table public.sessions
  add column if not exists company_url text;

-- 3. A session can have more than one person on stage. The closing keynote has
--    three. speaker_name stays the lead - it is what the announcer reads out
--    and what the programme lists - and these are resolved to profiles the
--    same way, by name.
alter table public.sessions
  add column if not exists co_speaker_names text[];

-- 4. Each room has a moderator, named under the room's tab in the programme.
--    Held as profile ids so the name and photo stay correct if a profile is
--    edited, and so the name can link through to them.
alter table public.app_settings
  add column if not exists moderator_main_id  uuid references public.profiles(id) on delete set null,
  add column if not exists moderator_demos_id uuid references public.profiles(id) on delete set null,
  add column if not exists moderator_open_id  uuid references public.profiles(id) on delete set null;
