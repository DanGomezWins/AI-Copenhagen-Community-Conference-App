-- The Open Space agenda, pushed in from the platform that runs the voting.
--
-- Deliberately its own table and not `sessions`. These rows are display-only:
-- they carry a facilitator's name as free text that may not match anyone in
-- the directory (people can propose anonymously, and the source has one name
-- field, not a first and last), and they must never reach the announcer's
-- "next up" logic or be mistaken for a scheduled talk with a room.

create table if not exists public.open_agenda (
  id          uuid primary key default uuid_generate_v4(),
  -- The order the agenda was pushed in, so it renders exactly as sent.
  position    int not null,
  title       text not null,
  description text,
  -- Plain text, and null when the topic was proposed anonymously.
  facilitator text,
  -- As supplied, e.g. "13:20 - 13:45". Not parsed: the source formats it and
  -- guessing at a timestamp we cannot verify would be worse than showing what
  -- they sent.
  slot        text,
  kind        text check (kind is null or kind in ('ask', 'tell')),
  created_at  timestamptz not null default now(),
  constraint open_agenda_title_not_blank check (length(btrim(title)) > 0)
);

create index if not exists open_agenda_position_idx on public.open_agenda (position);

alter table public.open_agenda enable row level security;

-- Everyone signed in reads it. Nobody writes it through the API: the push
-- endpoint uses the service role, so there is deliberately no write policy.
drop policy if exists open_agenda_read on public.open_agenda;
create policy open_agenda_read on public.open_agenda
  for select to authenticated using (true);
