-- Allow active workers to read all published shifts, all confirmed assignments
-- on published shifts, and all profiles so the "전체 일정 조회" view can show
-- the full roster identical to the admin schedule history.

-- 1. shifts: revert to pre-20260731102934 policy — any active user reads any
--    published shift (not only shifts where they hold a confirmed assignment).
drop policy if exists "authenticated read own published shifts or admin" on public.shifts;
create policy "authenticated read published shifts or admin"
on public.shifts for select
to authenticated
using (
  (select private.is_admin())
  or (
    status = 'published'
    and (select private.is_active_user())
  )
);

-- 2. shift_assignments: active users read all confirmed assignments on published
--    shifts (not only their own worker_id rows).
drop policy if exists "assignments read confirmed published own or admin" on public.shift_assignments;
create policy "assignments read confirmed published or admin"
on public.shift_assignments for select
to authenticated
using (
  (select private.is_admin())
  or (
    status = 'confirmed'
    and (select private.is_active_user())
    and exists (
      select 1
      from public.shifts shift
      where shift.id = shift_id
        and shift.status = 'published'
    )
  )
);

-- 3. profiles: active users can read all profiles (application code controls
--    which columns are selected; schedule views only use id + name).
drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read active or admin"
on public.profiles for select
to authenticated
using (
  (select private.is_active_user())
  or (select private.is_admin())
);

-- has_own_confirmed_assignment is no longer used by any policy; drop it.
drop function if exists private.has_own_confirmed_assignment(uuid);
