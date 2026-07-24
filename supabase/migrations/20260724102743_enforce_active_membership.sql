create or replace function private.is_active_user(
  target_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_id is not null
    and exists (
      select 1
      from public.profiles
      where id = target_id
        and is_active
    );
$$;

revoke all on function private.is_active_user(uuid) from public, anon;
grant execute on function private.is_active_user(uuid) to authenticated;

drop policy "profiles read own or admin" on public.profiles;
create policy "profiles read own or admin"
on public.profiles for select
to authenticated
using (
  (id = (select auth.uid()) and (select private.is_active_user()))
  or (select public.is_admin())
);

drop policy "authenticated read periods" on public.schedule_application_periods;
create policy "authenticated read periods"
on public.schedule_application_periods for select
to authenticated
using ((select private.is_active_user()));

drop policy "authenticated read published shifts" on public.shifts;
create policy "authenticated read published shifts"
on public.shifts for select
to authenticated
using (
  (status = 'published' and (select private.is_active_user()))
  or (select public.is_admin())
);

drop policy "applications read own or admin" on public.schedule_applications;
create policy "applications read own or admin"
on public.schedule_applications for select
to authenticated
using (
  (
    worker_id = (select auth.uid())
    and (select private.is_active_user())
  )
  or (select public.is_admin())
);

drop policy "workers or admin insert applications" on public.schedule_applications;
create policy "workers or admin insert applications"
on public.schedule_applications for insert
to authenticated
with check (
  (select public.is_admin())
  or (
    worker_id = (select auth.uid())
    and (select private.is_active_user())
    and status = 'applied'
    and exists (
      select 1
      from public.shifts shift
      join public.schedule_application_periods period
        on period.id = shift.application_period_id
      where shift.id = shift_id
        and shift.status = 'published'
        and period.status = 'open'
        and period.application_deadline > now()
    )
  )
);

drop policy "assignments read own or admin" on public.shift_assignments;
create policy "assignments read own or admin"
on public.shift_assignments for select
to authenticated
using (
  (
    worker_id = (select auth.uid())
    and (select private.is_active_user())
  )
  or (select public.is_admin())
);

drop policy "admin inserts assignments" on public.shift_assignments;
create policy "admin inserts assignments"
on public.shift_assignments for insert
to authenticated
with check (
  (select public.is_admin())
  and (select private.is_active_user(worker_id))
);

drop policy "admin updates assignments" on public.shift_assignments;
create policy "admin updates assignments"
on public.shift_assignments for update
to authenticated
using ((select public.is_admin()))
with check (
  (select public.is_admin())
  and (
    status = 'cancelled'
    or (select private.is_active_user(worker_id))
  )
);

drop policy "authenticated read skills" on public.worker_position_skills;
create policy "authenticated read skills"
on public.worker_position_skills for select
to authenticated
using ((select private.is_active_user()));

drop policy "attendance read own or admin" on public.attendance_records;
create policy "attendance read own or admin"
on public.attendance_records for select
to authenticated
using (
  (select public.is_admin())
  or (
    (select private.is_active_user())
    and exists (
      select 1
      from public.shift_assignments assignment
      where assignment.id = assignment_id
        and assignment.worker_id = (select auth.uid())
    )
  )
);

drop policy "payroll read own or admin" on public.monthly_payrolls;
create policy "payroll read own or admin"
on public.monthly_payrolls for select
to authenticated
using (
  (
    worker_id = (select auth.uid())
    and (select private.is_active_user())
  )
  or (select public.is_admin())
);

drop policy "payroll items read own or admin" on public.payroll_items;
create policy "payroll items read own or admin"
on public.payroll_items for select
to authenticated
using (
  (select public.is_admin())
  or (
    (select private.is_active_user())
    and exists (
      select 1
      from public.monthly_payrolls payroll
      where payroll.id = payroll_id
        and payroll.worker_id = (select auth.uid())
    )
  )
);

drop policy "notices read published or admin" on public.notices;
create policy "notices read published or admin"
on public.notices for select
to authenticated
using (
  (
    status = 'published'
    and (select private.is_active_user())
  )
  or (select public.is_admin())
);

drop policy "notice reads read own or admin" on public.notice_reads;
create policy "notice reads read own or admin"
on public.notice_reads for select
to authenticated
using (
  (
    worker_id = (select auth.uid())
    and (select private.is_active_user())
  )
  or (select public.is_admin())
);

drop policy "workers create own notice reads" on public.notice_reads;
create policy "workers create own notice reads"
on public.notice_reads for insert
to authenticated
with check (
  (
    worker_id = (select auth.uid())
    and (select private.is_active_user())
  )
  or (select public.is_admin())
);

drop policy "notifications read own or admin" on public.notification_logs;
create policy "notifications read own or admin"
on public.notification_logs for select
to authenticated
using (
  (
    recipient_id = (select auth.uid())
    and (select private.is_active_user())
  )
  or (select public.is_admin())
);

create or replace function public.cancel_own_schedule_application(
  application_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_active_user() then
    raise exception 'INACTIVE_ACCOUNT';
  end if;

  update public.schedule_applications application
     set status = 'cancelled',
         cancelled_at = now()
   where application.id = application_id
     and application.worker_id = auth.uid()
     and application.status = 'applied'
     and exists (
       select 1
       from public.shifts shift
       join public.schedule_application_periods period
         on period.id = shift.application_period_id
       where shift.id = application.shift_id
         and shift.status = 'published'
         and period.status = 'open'
         and period.application_deadline > now()
     );

  if not found then
    raise exception 'APPLICATION_CANNOT_BE_CANCELLED';
  end if;
end;
$$;
