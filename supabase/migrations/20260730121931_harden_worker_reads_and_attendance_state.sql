-- Remote migration version: 20260730121931.
do $$
begin
  if exists (
    select 1
    from public.attendance_records attendance
    join public.payroll_items item
      on item.attendance_record_id = attendance.id
     and item.voided_at is null
    where attendance.status = 'present'
      and (
        attendance.actual_started_at is null
        or attendance.actual_ended_at is null
      )
  ) then
    raise exception 'MIGRATION_BLOCKED_PRESENT_PAYROLL_WITHOUT_ACTUAL_TIME';
  end if;
end;
$$;

update public.attendance_records
set status = 'pending',
    confirmed_by = null,
    confirmed_at = null,
    corrected_by = null,
    corrected_at = null,
    correction_reason = null
where status = 'present'
  and (
    actual_started_at is null
    or actual_ended_at is null
  );

update public.attendance_records
set actual_started_at = null,
    actual_ended_at = null,
    confirmed_by = null,
    confirmed_at = null,
    corrected_by = null,
    corrected_at = null,
    correction_reason = null
where status = 'pending';

do $$
begin
  if exists (
    select 1
    from public.attendance_records
    where (
      status = 'present'
      and (
        actual_started_at is null
        or actual_ended_at is null
        or confirmed_by is null
        or confirmed_at is null
      )
    ) or (
      status = 'absent'
      and (
        actual_started_at is not null
        or actual_ended_at is not null
        or confirmed_by is null
        or confirmed_at is null
      )
    )
  ) then
    raise exception 'MIGRATION_BLOCKED_INVALID_ATTENDANCE_STATE';
  end if;
end;
$$;

alter table public.attendance_records
  add constraint attendance_status_actual_time_check check (
    (
      status = 'pending'
      and actual_started_at is null
      and actual_ended_at is null
      and confirmed_by is null
      and confirmed_at is null
    )
    or (
      status = 'absent'
      and actual_started_at is null
      and actual_ended_at is null
      and confirmed_by is not null
      and confirmed_at is not null
    )
    or (
      status = 'present'
      and actual_started_at is not null
      and actual_ended_at is not null
      and confirmed_by is not null
      and confirmed_at is not null
    )
  );

drop policy if exists "assignments read own or admin" on public.shift_assignments;
create policy "assignments read confirmed published own or admin"
on public.shift_assignments for select
to authenticated
using (
  (select private.is_admin())
  or (
    worker_id = (select auth.uid())
    and status = 'confirmed'
    and (select private.is_active_user())
    and exists (
      select 1
      from public.shifts shift
      where shift.id = shift_id
        and shift.status = 'published'
    )
  )
);
