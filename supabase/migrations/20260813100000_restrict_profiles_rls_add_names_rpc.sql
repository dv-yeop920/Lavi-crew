-- Fix: profiles RLS was too permissive — workers could read all columns
-- (phone, hourly_wage) of every profile. Restrict back to own-profile for
-- workers and expose only (id, name) via a security-definer RPC.

-- 1. Replace the overly broad policy with own-profile + admin.
drop policy if exists "profiles read active or admin" on public.profiles;
create policy "profiles read own or admin"
on public.profiles for select
to authenticated
using (
  id = (select auth.uid())
  or (select private.is_admin())
);

-- 2. RPC returning only id + name for active profiles. Any authenticated user
--    can call it, but the function runs as the definer (bypasses RLS) so
--    workers never touch the profiles table directly for other users' data.
create or replace function public.get_active_profile_names()
returns table (id uuid, name text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.name
  from public.profiles p
  where p.is_active = true;
$$;

revoke all on function public.get_active_profile_names() from public;
grant execute on function public.get_active_profile_names() to authenticated;
