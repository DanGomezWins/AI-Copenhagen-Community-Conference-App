-- Attendees book their own Open Sessions slot on the physical board and
-- photograph it themselves, so scanning is no longer an organiser-only action.
--
-- TRUST NOTE: this lets any signed-in attendee add, edit and cancel sessions on
-- the OPEN track. It does NOT touch Main stage or Demos, which stay
-- organiser-only. For a ticketed event of ~200 people that is a reasonable
-- trade; it would not be for an open-to-the-public app. Every change is
-- attributed and reversible, and organisers retain full edit rights.

drop policy if exists sessions_write on public.sessions;

-- Organisers: everything, every track.
create policy sessions_write_organiser on public.sessions
  for all to authenticated
  using (public.is_organiser())
  with check (public.is_organiser());

-- Attendees: the open track only.
create policy sessions_insert_open on public.sessions
  for insert to authenticated
  with check (track = 'open');

create policy sessions_update_open on public.sessions
  for update to authenticated
  using (track = 'open')
  with check (track = 'open');

-- Deliberately no attendee DELETE policy: cancelling keeps the slot visible so
-- people who already saw it understand it is gone. Deletion stays with organisers.

-- Feed notices for open-session changes.
drop policy if exists posts_write on public.posts;

create policy posts_write_organiser on public.posts
  for all to authenticated
  using (public.is_organiser())
  with check (public.is_organiser());

create policy posts_insert_open on public.posts
  for insert to authenticated
  with check (track = 'open' and kind = 'schedule_change');

-- Drafts belong to whoever created them; organisers can see them all.
drop policy if exists drafts_all on public.schedule_drafts;

create policy drafts_own on public.schedule_drafts
  for all to authenticated
  using (created_by = auth.uid() or public.is_organiser())
  with check (created_by = auth.uid() or public.is_organiser());

-- Scan photos: writable by any signed-in user into their own folder, readable
-- only by them and organisers.
drop policy if exists scans_organiser on storage.objects;

create policy scans_own_write on storage.objects
  for insert to authenticated
  with check (bucket_id = 'scans' and (storage.foldername(name))[1] = auth.uid()::text);

create policy scans_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'scans'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_organiser())
  );
