-- The prior migration briefly added an index equivalent to the foundation's
-- active_assignment_per_worker_shift_idx. Keep one canonical copy.
drop index if exists public.active_assignment_worker_per_shift_idx;

create function private.has_own_confirmed_assignment(target_shift_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.shift_assignments assignment
      where assignment.shift_id = target_shift_id
        and assignment.worker_id = auth.uid()
        and assignment.status = 'confirmed'
    );
$$;

revoke all on function private.has_own_confirmed_assignment(uuid)
  from public, anon;
grant execute on function private.has_own_confirmed_assignment(uuid)
  to authenticated;

drop policy if exists "authenticated read published shifts" on public.shifts;
create policy "authenticated read own published shifts or admin"
on public.shifts for select
to authenticated
using (
  (select private.is_admin())
  or (
    status = 'published'
    and (select private.is_active_user())
    and (select private.has_own_confirmed_assignment(id))
  )
);
