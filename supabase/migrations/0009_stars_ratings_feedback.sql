-- ============================================================
--  My Schedule, session ratings, and app feedback
-- ============================================================

-- ---------- starred sessions ----------
create table if not exists public.session_stars (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, session_id)
);

create index if not exists session_stars_profile_idx on public.session_stars (profile_id);

alter table public.session_stars enable row level security;

-- Your stars are yours: nobody else can see or change what you have starred.
drop policy if exists stars_own on public.session_stars;
create policy stars_own on public.session_stars
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ---------- ratings ----------
-- One table for both "rate this app" and "rate this session": the form is the
-- same, and keeping them together means one place to read feedback from.
do $$ begin
  create type rating_subject_t as enum ('app', 'session');
exception when duplicate_object then null; end $$;

create table if not exists public.ratings (
  id          uuid primary key default uuid_generate_v4(),
  subject     rating_subject_t not null,
  session_id  uuid references public.sessions(id) on delete cascade,
  stars       smallint not null check (stars between 1 and 5),
  comment     text,
  -- Who rated is stored so a person can revise their own rating rather than
  -- stacking duplicates. It is never shown: the feedback is anonymous to
  -- everyone reading it, including organisers.
  profile_id  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint session_required_for_session_rating
    check ((subject = 'session') = (session_id is not null))
);

-- One rating per person per thing, so revising replaces rather than adds.
create unique index if not exists ratings_one_per_app
  on public.ratings (profile_id) where subject = 'app';
create unique index if not exists ratings_one_per_session
  on public.ratings (profile_id, session_id) where subject = 'session';

create index if not exists ratings_session_idx on public.ratings (session_id);

drop trigger if exists ratings_touch on public.ratings;
create trigger ratings_touch before update on public.ratings
  for each row execute function public.touch_updated_at();

alter table public.ratings enable row level security;

-- People can write and revise their own rating.
drop policy if exists ratings_own_write on public.ratings;
create policy ratings_own_write on public.ratings
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Organisers read everything, for the review table.
drop policy if exists ratings_organiser_read on public.ratings;
create policy ratings_organiser_read on public.ratings
  for select to authenticated using (public.is_organiser());

-- ---------- feed posts by attendees ----------
-- Posts already carry an author; these let an attendee post an image and a
-- link alongside their text.
alter table public.posts add column if not exists image_url text;
alter table public.posts add column if not exists link_url text;

-- Photos attached to feed posts. Public because the feed is, writable only
-- into a folder named for the poster.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 5242880,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists post_images_read on storage.objects;
create policy post_images_read on storage.objects
  for select using (bucket_id = 'post-images');

drop policy if exists post_images_write_own on storage.objects;
create policy post_images_write_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'post-images'
              and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists post_images_delete_own on storage.objects;
create policy post_images_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'post-images'
         and ((storage.foldername(name))[1] = auth.uid()::text
              or public.is_organiser()));

-- ---------- feed opened to everyone ----------
-- Anyone signed in may post, and may edit or delete their own post.
-- Organisers keep full control over everything, so a bad post can be removed
-- by someone other than its author.
drop policy if exists posts_insert_open on public.posts;

drop policy if exists posts_insert_any on public.posts;
create policy posts_insert_any on public.posts
  for insert to authenticated
  with check (author_id = auth.uid() and kind in ('info', 'schedule_change'));

drop policy if exists posts_update_own on public.posts;
create policy posts_update_own on public.posts
  for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists posts_delete_own on public.posts;
create policy posts_delete_own on public.posts
  for delete to authenticated
  using (author_id = auth.uid() or public.is_organiser());

-- ---------- app settings ----------
-- The Open Sessions track is published on a separate site; the tab links out.
alter table public.app_settings
  add column if not exists open_sessions_url text;
