-- ============================================================
--  AIC Info — storage buckets
-- ============================================================

-- Profile photos: publicly readable (they appear in the directory),
-- writable only by the owning user, under a folder named for their uid.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880,
        array['image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do nothing;

-- Whiteboard scans: private, organisers only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('scans', 'scans', false, 20971520,
        array['image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do nothing;

drop policy if exists avatars_read on storage.objects;
create policy avatars_read on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists avatars_write_own on storage.objects;
create policy avatars_write_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists scans_organiser on storage.objects;
create policy scans_organiser on storage.objects
  for all to authenticated
  using (bucket_id = 'scans' and public.is_organiser())
  with check (bucket_id = 'scans' and public.is_organiser());
