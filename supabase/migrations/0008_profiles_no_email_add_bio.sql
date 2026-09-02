-- Profiles are now pre-created from the ticket list rather than built by the
-- attendee, and the sponsor asked that email addresses not appear on them.

-- Email is dropped rather than merely hidden: holding personal data we have
-- decided not to show is the wrong default, and the sign-in address already
-- lives in auth.users where only the service role can read it.
alter table public.profiles drop column if exists public_email;

-- The "professional profile" summary. Speakers arrive with one; attendees may
-- add one if they want to.
alter table public.profiles add column if not exists bio text;

-- Where a speaker's slides can be downloaded. PDF only, by agreement.
-- Nothing is auto-posted for a session without one.
alter table public.sessions add column if not exists slides_url text;

-- A short description shown on the session's own page.
alter table public.sessions add column if not exists description text;

-- Marks a profile that was created from the ticket list rather than by the
-- person themselves, so the app can tell "we made this for you, check it" from
-- "you built this".
alter table public.profiles
  add column if not exists is_prefilled boolean not null default false;
