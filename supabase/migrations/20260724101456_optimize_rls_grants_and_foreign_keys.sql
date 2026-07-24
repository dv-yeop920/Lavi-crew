create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and is_active
  );
$$;

drop policy if exists "profiles own or admin" on public.profiles;
drop policy if exists "admin manages profiles" on public.profiles;
drop policy if exists "admin manages operational tables" on public.invite_codes;
drop policy if exists "authenticated read periods" on public.schedule_application_periods;
drop policy if exists "admin manages periods" on public.schedule_application_periods;
drop policy if exists "authenticated read shifts" on public.shifts;
drop policy if exists "admin manages shifts" on public.shifts;
drop policy if exists "workers own applications" on public.schedule_applications;
drop policy if exists "workers apply while open" on public.schedule_applications;
drop policy if exists "admin manages applications" on public.schedule_applications;
drop policy if exists "workers own assignments" on public.shift_assignments;
drop policy if exists "admin manages assignments" on public.shift_assignments;
drop policy if exists "authenticated read skills" on public.worker_position_skills;
drop policy if exists "admin manages skills" on public.worker_position_skills;
drop policy if exists "workers own attendance" on public.attendance_records;
drop policy if exists "admin manages attendance" on public.attendance_records;
drop policy if exists "workers own payroll" on public.monthly_payrolls;
drop policy if exists "admin manages payroll" on public.monthly_payrolls;
drop policy if exists "workers own payroll items" on public.payroll_items;
drop policy if exists "admin manages payroll items" on public.payroll_items;
drop policy if exists "authenticated read notices" on public.notices;
drop policy if exists "admin manages notices" on public.notices;
drop policy if exists "workers own notice reads" on public.notice_reads;
drop policy if exists "workers create own notice reads" on public.notice_reads;
drop policy if exists "admin reads notifications" on public.notification_logs;
drop policy if exists "workers own notifications" on public.notification_logs;
drop policy if exists "admin manages notifications" on public.notification_logs;

create policy "profiles read own or admin"
on public.profiles for select
to authenticated
using (
  id = (select auth.uid())
  or (select public.is_admin())
);

create policy "admin updates profiles"
on public.profiles for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "admin manages invite codes"
on public.invite_codes for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "authenticated read periods"
on public.schedule_application_periods for select
to authenticated
using (true);

create policy "admin inserts periods"
on public.schedule_application_periods for insert
to authenticated
with check ((select public.is_admin()));

create policy "admin updates periods"
on public.schedule_application_periods for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "authenticated read published shifts"
on public.shifts for select
to authenticated
using (
  status = 'published'
  or (select public.is_admin())
);

create policy "admin inserts shifts"
on public.shifts for insert
to authenticated
with check ((select public.is_admin()));

create policy "admin updates shifts"
on public.shifts for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "applications read own or admin"
on public.schedule_applications for select
to authenticated
using (
  worker_id = (select auth.uid())
  or (select public.is_admin())
);

create policy "workers or admin insert applications"
on public.schedule_applications for insert
to authenticated
with check (
  (select public.is_admin())
  or (
    worker_id = (select auth.uid())
    and status = 'applied'
    and exists (
      select 1
      from public.shifts shift
      join public.schedule_application_periods period
        on period.id = shift.application_period_id
      where shift.id = shift_id
        and period.status = 'open'
        and period.application_deadline > now()
    )
  )
);

create policy "admin updates applications"
on public.schedule_applications for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "assignments read own or admin"
on public.shift_assignments for select
to authenticated
using (
  worker_id = (select auth.uid())
  or (select public.is_admin())
);

create policy "admin inserts assignments"
on public.shift_assignments for insert
to authenticated
with check ((select public.is_admin()));

create policy "admin updates assignments"
on public.shift_assignments for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "authenticated read skills"
on public.worker_position_skills for select
to authenticated
using (true);

create policy "admin inserts skills"
on public.worker_position_skills for insert
to authenticated
with check ((select public.is_admin()));

create policy "admin updates skills"
on public.worker_position_skills for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "admin deletes skills"
on public.worker_position_skills for delete
to authenticated
using ((select public.is_admin()));

create policy "attendance read own or admin"
on public.attendance_records for select
to authenticated
using (
  (select public.is_admin())
  or exists (
    select 1
    from public.shift_assignments assignment
    where assignment.id = assignment_id
      and assignment.worker_id = (select auth.uid())
  )
);

create policy "payroll read own or admin"
on public.monthly_payrolls for select
to authenticated
using (
  worker_id = (select auth.uid())
  or (select public.is_admin())
);

create policy "payroll items read own or admin"
on public.payroll_items for select
to authenticated
using (
  (select public.is_admin())
  or exists (
    select 1
    from public.monthly_payrolls payroll
    where payroll.id = payroll_id
      and payroll.worker_id = (select auth.uid())
  )
);

create policy "notices read published or admin"
on public.notices for select
to authenticated
using (
  status = 'published'
  or (select public.is_admin())
);

create policy "admin inserts notices"
on public.notices for insert
to authenticated
with check ((select public.is_admin()));

create policy "admin updates notices"
on public.notices for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "notice reads read own or admin"
on public.notice_reads for select
to authenticated
using (
  worker_id = (select auth.uid())
  or (select public.is_admin())
);

create policy "workers create own notice reads"
on public.notice_reads for insert
to authenticated
with check (
  worker_id = (select auth.uid())
  or (select public.is_admin())
);

create policy "notifications read own or admin"
on public.notification_logs for select
to authenticated
using (
  recipient_id = (select auth.uid())
  or (select public.is_admin())
);

create policy "admin inserts notifications"
on public.notification_logs for insert
to authenticated
with check ((select public.is_admin()));

create policy "admin updates notifications"
on public.notification_logs for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

revoke insert, update, delete on all tables in schema public from authenticated;

grant update on public.profiles to authenticated;
grant insert, update, delete on public.invite_codes to authenticated;
grant insert, update on public.schedule_application_periods to authenticated;
grant insert, update on public.shifts to authenticated;
grant insert, update on public.schedule_applications to authenticated;
grant insert, update on public.shift_assignments to authenticated;
grant insert, update, delete on public.worker_position_skills to authenticated;
grant insert, update on public.notices to authenticated;
grant insert on public.notice_reads to authenticated;
grant insert, update on public.notification_logs to authenticated;

create index if not exists attendance_records_confirmed_by_idx
  on public.attendance_records (confirmed_by)
  where confirmed_by is not null;
create index if not exists attendance_records_corrected_by_idx
  on public.attendance_records (corrected_by)
  where corrected_by is not null;
create index if not exists invite_codes_created_by_idx
  on public.invite_codes (created_by);
create index if not exists notices_author_id_idx
  on public.notices (author_id);
create index if not exists notification_logs_assignment_id_idx
  on public.notification_logs (assignment_id)
  where assignment_id is not null;
create index if not exists notification_logs_recipient_id_idx
  on public.notification_logs (recipient_id);
create index if not exists notification_logs_shift_id_idx
  on public.notification_logs (shift_id);
create index if not exists payroll_items_voided_by_idx
  on public.payroll_items (voided_by)
  where voided_by is not null;
create index if not exists schedule_application_periods_managed_by_idx
  on public.schedule_application_periods (managed_by);
create index if not exists shift_assignments_assigned_by_idx
  on public.shift_assignments (assigned_by);
create index if not exists shifts_application_period_id_idx
  on public.shifts (application_period_id);
create index if not exists shifts_created_by_idx
  on public.shifts (created_by);
create index if not exists worker_position_skills_assigned_by_idx
  on public.worker_position_skills (assigned_by);
