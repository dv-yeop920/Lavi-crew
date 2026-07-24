drop policy "authenticated read skills" on public.worker_position_skills;
create policy "workers read own skills or admin"
on public.worker_position_skills for select
to authenticated
using (
  (
    worker_id = (select auth.uid())
    and (select private.is_active_user())
  )
  or (select private.is_admin())
);

alter function public.close_application_period(uuid)
set search_path = '';

alter table public.attendance_records
  drop constraint attendance_actual_time_pair_check,
  add constraint attendance_actual_time_pair_check check (
    (actual_started_at is null and actual_ended_at is null)
    or (
      actual_started_at is not null
      and actual_ended_at is not null
      and actual_ended_at > actual_started_at
      and actual_ended_at - actual_started_at < interval '24 hours'
    )
  );

create or replace function public.confirm_attendance_and_payroll(
  record_id uuid,
  next_status public.attendance_status,
  actual_start timestamptz default null,
  actual_end timestamptz default null,
  correction_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  attendance public.attendance_records;
  assignment public.shift_assignments;
  work_shift public.shifts;
  payroll public.monthly_payrolls;
  worked_minutes integer;
  regular_minutes integer;
  overtime_minutes integer;
  payment integer;
begin
  if not private.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  if next_status not in ('present', 'absent') then
    raise exception 'INVALID_ATTENDANCE_STATUS';
  end if;

  select *
    into attendance
    from public.attendance_records
   where id = record_id
   for update;

  if not found then
    raise exception 'ATTENDANCE_NOT_FOUND';
  end if;

  if attendance.confirmed_at is not null
     and nullif(trim(correction_note), '') is null then
    raise exception 'CORRECTION_REASON_REQUIRED';
  end if;

  select *
    into assignment
    from public.shift_assignments
   where id = attendance.assignment_id;

  select *
    into work_shift
    from public.shifts
   where id = assignment.shift_id;

  if assignment.status <> 'confirmed'
     or work_shift.status <> 'published'
     or work_shift.work_date > (now() at time zone 'Asia/Seoul')::date then
    raise exception 'ATTENDANCE_NOT_CONFIRMABLE';
  end if;

  if next_status = 'present' then
    if actual_start is null or actual_end is null or actual_end <= actual_start then
      raise exception 'ACTUAL_WORK_TIME_REQUIRED';
    end if;

    if (actual_start at time zone 'Asia/Seoul')::date <> work_shift.work_date
       or (actual_end at time zone 'Asia/Seoul')::date <> work_shift.work_date then
      raise exception 'ACTUAL_WORK_DATE_MISMATCH';
    end if;

    if actual_end > now() then
      raise exception 'ACTUAL_WORK_TIME_IN_FUTURE';
    end if;
  elsif actual_start is not null or actual_end is not null then
    raise exception 'ABSENCE_CANNOT_HAVE_WORK_TIME';
  end if;

  update public.attendance_records
     set status = next_status,
         actual_started_at = actual_start,
         actual_ended_at = actual_end,
         confirmed_by = auth.uid(),
         confirmed_at = now(),
         correction_reason = nullif(trim(correction_note), ''),
         corrected_by = case
           when attendance.confirmed_at is null then null
           else auth.uid()
         end,
         corrected_at = case
           when attendance.confirmed_at is null then null
           else now()
         end
   where id = record_id;

  update public.payroll_items
     set voided_at = now(),
         voided_by = auth.uid(),
         void_reason = coalesce(
           nullif(trim(correction_note), ''),
           'attendance corrected'
         )
   where attendance_record_id = record_id
     and voided_at is null;

  if next_status = 'present' then
    worked_minutes := floor(extract(epoch from (actual_end - actual_start)) / 60)::integer;
    regular_minutes := least(worked_minutes, 540);
    overtime_minutes := greatest(worked_minutes - 540, 0);
    payment := round(
      (
        regular_minutes * assignment.hourly_wage_snapshot
        + overtime_minutes * assignment.hourly_wage_snapshot * 1.5
      ) / 60.0
    );

    insert into public.monthly_payrolls (
      worker_id,
      year_month,
      total_amount
    )
    values (
      assignment.worker_id,
      date_trunc('month', work_shift.work_date)::date,
      0
    )
    on conflict (worker_id, year_month)
    do update set updated_at = now()
    returning * into payroll;

    insert into public.payroll_items (
      payroll_id,
      assignment_id,
      attendance_record_id,
      regular_minutes,
      overtime_minutes,
      amount
    )
    values (
      payroll.id,
      assignment.id,
      record_id,
      regular_minutes,
      overtime_minutes,
      payment
    );
  end if;

  update public.monthly_payrolls monthly
     set total_amount = coalesce(
       (
         select sum(item.amount)
           from public.payroll_items item
          where item.payroll_id = monthly.id
            and item.voided_at is null
       ),
       0
     )
   where monthly.worker_id = assignment.worker_id
     and monthly.year_month = date_trunc('month', work_shift.work_date)::date;
end;
$$;

revoke all on function public.confirm_attendance_and_payroll(
  uuid,
  public.attendance_status,
  timestamptz,
  timestamptz,
  text
) from public, anon;

grant execute on function public.confirm_attendance_and_payroll(
  uuid,
  public.attendance_status,
  timestamptz,
  timestamptz,
  text
) to authenticated;
