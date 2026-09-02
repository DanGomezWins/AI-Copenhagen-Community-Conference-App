-- Tracks the "slides are available" post separately from the "next up" one,
-- so a session can announce twice: once before it starts, once after it ends.
alter table public.sessions
  add column if not exists slides_announced_at timestamptz;

-- A session whose slides URL changes should announce again.
create or replace function public.sessions_before_update()
returns trigger language plpgsql as $$
begin
  if new.starts_at is distinct from old.starts_at
     or new.room is distinct from old.room
     or new.title is distinct from old.title then
    new.announced_at := null;
  end if;
  if new.slides_url is distinct from old.slides_url then
    new.slides_announced_at := null;
  end if;
  new.updated_at := now();
  return new;
end $$;
