-- The feed badges organiser posts, which needs to know which profiles belong
-- to organisers. Doing that by reading `organisers` directly would expose
-- email addresses to whoever asked; this returns only ids.
create or replace function public.organiser_profile_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.profiles p
  join auth.users u on u.id = p.id
  join public.organisers o on lower(o.email) = lower(u.email);
$$;

revoke all on function public.organiser_profile_ids() from public, anon;
grant execute on function public.organiser_profile_ids() to authenticated, service_role;
