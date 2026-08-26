-- ============================================================
--  AIC Info — initial schema
--  AI Meetup Copenhagen Community Conference #1, 10 Sep 2026
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- enums ----------
do $$ begin
  create type track_t as enum ('main', 'demos', 'open');
exception when duplicate_object then null; end $$;

do $$ begin
  create type session_status_t as enum ('scheduled', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type post_kind_t as enum ('info', 'alert', 'schedule_change', 'auto');
exception when duplicate_object then null; end $$;

do $$ begin
  create type draft_status_t as enum ('processing', 'review', 'published', 'discarded');
exception when duplicate_object then null; end $$;

-- ---------- helpers ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------- organisers (admin allowlist) ----------
create table if not exists public.organisers (
  email      text primary key,
  note       text,
  created_at timestamptz not null default now()
);

-- Checks the caller's JWT email against the allowlist.
-- SECURITY DEFINER so it can read `organisers` even though RLS hides that
-- table from ordinary users — otherwise every policy using it would fail.
create or replace function public.is_organiser()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organisers o
    where lower(o.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ---------- attendee allowlist (from the checkin.no export) ----------
-- Gates sign-in and pre-fills a new profile. Deliberately NOT a public
-- profile: nothing here is visible to other attendees until the person
-- creates their own profile row.
create table if not exists public.attendee_allowlist (
  email       text primary key,
  first_name  text,
  last_name   text,
  company     text,
  role        text,
  is_speaker  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------- profiles ----------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  first_name   text not null,
  last_name    text not null,
  is_speaker   boolean not null default false,
  company      text,
  role         text,
  linkedin_url text,
  public_email text,
  photo_url    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint first_name_not_blank check (length(btrim(first_name)) > 0),
  constraint last_name_not_blank  check (length(btrim(last_name))  > 0)
);

create index if not exists profiles_sort_idx    on public.profiles (last_name, first_name);
create index if not exists profiles_speaker_idx on public.profiles (is_speaker);

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------- sessions (the program) ----------
create table if not exists public.sessions (
  id                 uuid primary key default uuid_generate_v4(),
  track              track_t not null,
  title              text not null,
  speaker_name       text,
  speaker_profile_id uuid references public.profiles(id) on delete set null,
  starts_at          timestamptz not null,
  ends_at            timestamptz,
  room               text,
  status             session_status_t not null default 'scheduled',
  notes              text,
  announced_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint ends_after_starts check (ends_at is null or ends_at > starts_at)
);

create index if not exists sessions_track_time_idx on public.sessions (track, starts_at);
create index if not exists sessions_pending_ann_idx
  on public.sessions (starts_at) where announced_at is null and status = 'scheduled';

-- A moved or re-roomed session must announce again, so clear the stamp.
-- Without this the auto-announcer would silently skip rescheduled sessions.
create or replace function public.sessions_before_update()
returns trigger language plpgsql as $$
begin
  if new.starts_at is distinct from old.starts_at
     or new.room is distinct from old.room
     or new.title is distinct from old.title then
    new.announced_at := null;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists sessions_touch on public.sessions;
create trigger sessions_touch before update on public.sessions
  for each row execute function public.sessions_before_update();

-- ---------- posts (the feed) ----------
create table if not exists public.posts (
  id         uuid primary key default uuid_generate_v4(),
  body       text not null,
  kind       post_kind_t not null default 'info',
  author_id  uuid references public.profiles(id) on delete set null,
  session_id uuid references public.sessions(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint body_not_blank check (length(btrim(body)) > 0)
);

create index if not exists posts_created_idx on public.posts (created_at desc);

-- ---------- schedule drafts (OCR agent state) ----------
create table if not exists public.schedule_drafts (
  id           uuid primary key default uuid_generate_v4(),
  photo_url    text not null,
  status       draft_status_t not null default 'processing',
  track        track_t not null default 'open',
  proposed     jsonb not null default '[]'::jsonb,
  conversation jsonb not null default '[]'::jsonb,
  error        text,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists drafts_status_idx on public.schedule_drafts (status, created_at desc);

-- ---------- push subscriptions ----------
create table if not exists public.push_subscriptions (
  id         uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  endpoint   text not null unique,
  keys       jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists push_profile_idx on public.push_subscriptions (profile_id);

-- ---------- app settings (single row) ----------
create table if not exists public.app_settings (
  id            boolean primary key default true,
  auto_announce boolean not null default true,
  updated_at    timestamptz not null default now(),
  constraint single_row check (id)
);

insert into public.app_settings (id) values (true) on conflict do nothing;

drop trigger if exists app_settings_touch on public.app_settings;
create trigger app_settings_touch before update on public.app_settings
  for each row execute function public.touch_updated_at();
