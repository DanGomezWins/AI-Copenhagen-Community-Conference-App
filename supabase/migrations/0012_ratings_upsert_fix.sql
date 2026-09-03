-- ============================================================
--  Make rating upserts actually work
-- ============================================================
--
-- 0009 enforced "one rating per person per thing" with two PARTIAL unique
-- indexes. Postgres cannot infer a conflict target from a partial index unless
-- the statement repeats the index predicate, and PostgREST has no way to send
-- one. So every single rating save failed with:
--
--   there is no unique or exclusion constraint matching the ON CONFLICT
--   specification
--
-- Testing found it: the ratings table had zero rows, because nothing had ever
-- saved successfully — for sessions or for the app.
--
-- One non-partial index replaces both. NULLS NOT DISTINCT (Postgres 15+) is
-- what makes it cover app ratings too: those carry session_id = null, and
-- without it every app rating would count as distinct and stack up.

drop index if exists public.ratings_one_per_app;
drop index if exists public.ratings_one_per_session;

-- Belt and braces: if any duplicates were somehow written while the upsert was
-- broken, keep the most recent per (person, thing) so the index can be built.
delete from public.ratings a
using public.ratings b
where a.profile_id is not distinct from b.profile_id
  and a.session_id is not distinct from b.session_id
  and a.created_at < b.created_at;

create unique index if not exists ratings_one_per_person_per_thing
  on public.ratings (profile_id, session_id) nulls not distinct;
