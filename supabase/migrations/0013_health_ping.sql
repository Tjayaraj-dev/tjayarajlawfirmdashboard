-- Keep-alive probe for the free-tier inactivity timer.
--
-- /api/health calls this so UptimeRobot's ping runs a real query on Postgres,
-- resetting Supabase's 7-day auto-pause clock. It only returns now() — it
-- touches no table, so it needs none of the fail-closed table grants. Executable
-- by anon (the health route is unauthenticated) but exposes nothing.
create or replace function public.ping()
returns timestamptz
language sql
stable
as $$ select now(); $$;

revoke all on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated;
