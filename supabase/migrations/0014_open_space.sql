-- Open Space: attendees propose discussion topics and vote on them. The
-- highest-voted topics get a room.
--
-- Separate from `sessions` on purpose. A topic is a candidate, not a scheduled
-- thing: it has no room, no confirmed time, and it competes. Folding it into
-- sessions would mean every query that lists the programme has to exclude
-- candidates, and the announcer would eventually post about one.

create table if not exists public.open_topics (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  detail        text,
  kind          text not null check (kind in ('ask', 'tell')),
  -- Free text rather than a foreign key to a slot table: the slots are the
  -- Demos track's times and only exist as labels on a form.
  slot          text,
  -- Null means proposed anonymously. created_by is recorded either way, so a
  -- proposer can still edit their own topic - it is never shown to anyone.
  proposer_name text,
  created_by    uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint open_topic_title_not_blank check (length(btrim(title)) > 0)
);

create index if not exists open_topics_created_idx on public.open_topics (created_at desc);

drop trigger if exists open_topics_touch on public.open_topics;
create trigger open_topics_touch before update on public.open_topics
  for each row execute function public.touch_updated_at();

-- One row per person per topic, so the primary key is the ballot box: a second
-- vote from the same person cannot be inserted, whatever the client does.
create table if not exists public.open_topic_votes (
  topic_id   uuid not null references public.open_topics(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (topic_id, profile_id)
);

create index if not exists open_topic_votes_topic_idx on public.open_topic_votes (topic_id);

alter table public.open_topics      enable row level security;
alter table public.open_topic_votes enable row level security;

-- Everyone signed in reads the board - that is the whole point of it.
drop policy if exists open_topics_read on public.open_topics;
create policy open_topics_read on public.open_topics
  for select to authenticated using (true);

-- Anyone may propose, but only as themselves.
drop policy if exists open_topics_insert on public.open_topics;
create policy open_topics_insert on public.open_topics
  for insert to authenticated with check (created_by = auth.uid());

-- Edit and remove your own; organisers can tidy up anything on the day.
drop policy if exists open_topics_update on public.open_topics;
create policy open_topics_update on public.open_topics
  for update to authenticated
  using (created_by = auth.uid() or public.is_organiser())
  with check (created_by = auth.uid() or public.is_organiser());

drop policy if exists open_topics_delete on public.open_topics;
create policy open_topics_delete on public.open_topics
  for delete to authenticated
  using (created_by = auth.uid() or public.is_organiser());

-- Vote counts are public; the board is a tally, not a secret ballot.
drop policy if exists open_votes_read on public.open_topic_votes;
create policy open_votes_read on public.open_topic_votes
  for select to authenticated using (true);

-- But you can only cast and withdraw your own.
drop policy if exists open_votes_own on public.open_topic_votes;
create policy open_votes_own on public.open_topic_votes
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
