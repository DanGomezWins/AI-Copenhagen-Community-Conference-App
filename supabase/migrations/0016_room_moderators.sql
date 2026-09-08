-- A room can have more than one moderator. Demos and Open Sessions both have
-- two, which the single moderator_*_id column on app_settings could not hold.

create table if not exists public.room_moderators (
  track      text not null check (track in ('main', 'demos', 'open')),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  -- The order they are listed in, so "X and Y" reads the way the organisers
  -- said it rather than however Postgres returns rows.
  position   int not null default 0,
  primary key (track, profile_id)
);

create index if not exists room_moderators_track_idx on public.room_moderators (track, position);

alter table public.room_moderators enable row level security;

-- Everyone signed in sees who is running the room; that is the point of it.
drop policy if exists room_moderators_read on public.room_moderators;
create policy room_moderators_read on public.room_moderators
  for select to authenticated using (true);

drop policy if exists room_moderators_write on public.room_moderators;
create policy room_moderators_write on public.room_moderators
  for all to authenticated
  using (public.is_organiser())
  with check (public.is_organiser());

-- Carry over whatever the single-moderator columns held, then retire them.
insert into public.room_moderators (track, profile_id, position)
select 'main', moderator_main_id, 0 from public.app_settings where moderator_main_id is not null
union all
select 'demos', moderator_demos_id, 0 from public.app_settings where moderator_demos_id is not null
union all
select 'open', moderator_open_id, 0 from public.app_settings where moderator_open_id is not null
on conflict do nothing;

alter table public.app_settings
  drop column if exists moderator_main_id,
  drop column if exists moderator_demos_id,
  drop column if exists moderator_open_id;
