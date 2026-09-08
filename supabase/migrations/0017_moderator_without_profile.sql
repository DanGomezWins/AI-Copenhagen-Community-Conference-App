-- A moderator does not necessarily have an account.
--
-- Moderating is a role at the event, not a sign-in. Requiring a profile meant
-- someone who is definitely running a room could not be named until an account
-- existed for them - which is backwards, and left a room looking unmoderated.
--
-- With a profile: the name links to it, as before. Without: the name is shown
-- as given, optionally linking to LinkedIn instead.

alter table public.room_moderators
  add column if not exists name text,
  add column if not exists linkedin_url text;

-- The primary key is (track, profile_id), which cannot hold a null - so it has
-- to go before profile_id can become optional. A surrogate key replaces it, and
-- a partial unique index keeps one-person-once per room.
alter table public.room_moderators
  drop constraint if exists room_moderators_pkey;

alter table public.room_moderators
  alter column profile_id drop not null;

alter table public.room_moderators
  add column if not exists id uuid primary key default uuid_generate_v4();

create unique index if not exists room_moderators_profile_once
  on public.room_moderators (track, profile_id)
  where profile_id is not null;

-- A row has to name somebody, one way or the other.
alter table public.room_moderators
  drop constraint if exists room_moderators_identifies_someone;
alter table public.room_moderators
  add constraint room_moderators_identifies_someone
  check (profile_id is not null or length(btrim(coalesce(name, ''))) > 0);
