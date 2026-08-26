-- ============================================================
--  AIC Info — row level security
--  Default posture: authenticated attendees READ the shared
--  event data; only organisers WRITE it; each attendee owns
--  exactly their own profile row.
-- ============================================================

alter table public.profiles           enable row level security;
alter table public.sessions           enable row level security;
alter table public.posts              enable row level security;
alter table public.schedule_drafts    enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.organisers         enable row level security;
alter table public.attendee_allowlist enable row level security;
alter table public.app_settings       enable row level security;

-- ---------- profiles ----------
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own on public.profiles
  for delete to authenticated using (auth.uid() = id or public.is_organiser());

-- ---------- sessions ----------
drop policy if exists sessions_read on public.sessions;
create policy sessions_read on public.sessions
  for select to authenticated using (true);

drop policy if exists sessions_write on public.sessions;
create policy sessions_write on public.sessions
  for all to authenticated using (public.is_organiser()) with check (public.is_organiser());

-- ---------- posts ----------
drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts
  for select to authenticated using (true);

drop policy if exists posts_write on public.posts;
create policy posts_write on public.posts
  for all to authenticated using (public.is_organiser()) with check (public.is_organiser());

-- ---------- schedule drafts (organisers only, both ways) ----------
drop policy if exists drafts_all on public.schedule_drafts;
create policy drafts_all on public.schedule_drafts
  for all to authenticated using (public.is_organiser()) with check (public.is_organiser());

-- ---------- push subscriptions (each user manages their own) ----------
drop policy if exists push_own on public.push_subscriptions;
create policy push_own on public.push_subscriptions
  for all to authenticated using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- ---------- app settings ----------
drop policy if exists settings_read on public.app_settings;
create policy settings_read on public.app_settings
  for select to authenticated using (true);

drop policy if exists settings_write on public.app_settings;
create policy settings_write on public.app_settings
  for update to authenticated using (public.is_organiser()) with check (public.is_organiser());

-- ---------- organisers ----------
-- Readable so the app can show admin UI; writable only via service role
-- (no policy = no access for anon/authenticated on write).
drop policy if exists organisers_read on public.organisers;
create policy organisers_read on public.organisers
  for select to authenticated using (true);

-- ---------- attendee allowlist ----------
-- Contains personal data of people who have NOT opted into the directory.
-- No read policy for ordinary users: only the service role touches it,
-- during sign-in gating and profile prefill.
drop policy if exists allowlist_organiser_read on public.attendee_allowlist;
create policy allowlist_organiser_read on public.attendee_allowlist
  for select to authenticated using (public.is_organiser());

-- ---------- realtime ----------
-- Drives the live feed and the program's "happening now" state.
do $$ begin
  alter publication supabase_realtime add table public.posts;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.sessions;
exception when duplicate_object then null; end $$;
