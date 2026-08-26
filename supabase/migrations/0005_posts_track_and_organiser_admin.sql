-- Optional track tag on a feed post. Everyone still sees every post; the tag
-- only tells them who it is aimed at, so nobody can filter themselves out of
-- an all-hands alert.
alter table public.posts add column if not exists track track_t;

-- Posts are edited and deleted after the fact (a wrong "break in 10 minutes"
-- cannot be unsent, but it can be corrected), so track when that happened.
alter table public.posts add column if not exists updated_at timestamptz;
alter table public.posts add column if not exists edited boolean not null default false;

create or replace function public.posts_before_update()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if new.body is distinct from old.body then
    new.edited := true;
  end if;
  return new;
end $$;

drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update on public.posts
  for each row execute function public.posts_before_update();

-- Organisers can now add and remove other organisers from inside the app, so
-- Martin can hand posting rights to a room host on the day without needing a
-- database console. Self-removal is blocked to avoid locking everyone out.
drop policy if exists organisers_insert on public.organisers;
create policy organisers_insert on public.organisers
  for insert to authenticated with check (public.is_organiser());

drop policy if exists organisers_delete on public.organisers;
create policy organisers_delete on public.organisers
  for delete to authenticated
  using (
    public.is_organiser()
    and lower(email) <> lower(coalesce(auth.jwt() ->> 'email', ''))
  );
