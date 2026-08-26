-- The migration ledger sits in the public schema, so PostgREST would expose
-- it to any anon-key holder. Enable RLS with no policies: deny-all for
-- anon/authenticated, while the service role and direct Postgres connections
-- (which bypass RLS) keep working.
alter table public._migrations enable row level security;

revoke all on public._migrations from anon, authenticated;
