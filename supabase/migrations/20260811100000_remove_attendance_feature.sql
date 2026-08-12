-- Remove the attendance/absence confirmation workflow. Payroll is now calculated at
-- schedule confirmation time from shift start/end times instead of confirmed actual
-- attendance times. This migration keeps the `attendance_records` table itself (still
-- populated by the existing insert trigger) but detaches payroll from it and drops the
-- attendance confirmation RPCs.

-- 1. payroll_items no longer requires an attendance record.
alter table public.payroll_items
  alter column attendance_record_id drop not null;

-- 2. Payroll items are now unique per assignment (one active revision) instead of per
-- attendance record.
drop index if exists public.payroll_items_one_active_revision_idx;
create unique index payroll_items_one_active_per_assignment_idx
  on public.payroll_items (assignment_id) where voided_at is null;

-- 3. Helper to create a payroll item for a confirmed assignment from its shift's
-- scheduled start/end time, applying the nine-hour daily overtime rule.
create or replace function private.create_payroll_for_assignment(
  p_assignment_id uuid,
  p_caller_id uuid
) returns void
language plpgsql
set search_path = ''
as $$
declare
  assignment public.shift_assignments;
  work_shift public.shifts;
  payroll public.monthly_payrolls;
  worked_minutes integer;
  regular_minutes integer;
  overtime_minutes integer;
  payment integer;
begin
  select * into assignment from public.shift_assignments where id = p_assignment_id;
  if not found then return; end if;
  select * into work_shift from public.shifts where id = assignment.shift_id;
  if not found then return; end if;

  worked_minutes := extract(epoch from (work_shift.end_time - work_shift.start_time))::integer / 60;
  regular_minutes := least(worked_minutes, 540);
  overtime_minutes := greatest(worked_minutes - 540, 0);
  payment := round(
    (regular_minutes * assignment.hourly_wage_snapshot / 60.0) +
    (overtime_minutes * assignment.hourly_wage_snapshot * 1.5 / 60.0)
  );

  insert into public.monthly_payrolls (worker_id, year_month, total_amount)
  values (assignment.worker_id, date_trunc('month', work_shift.work_date)::date, 0)
  on conflict (worker_id, year_month) do update set updated_at = now()
  returning * into payroll;

  insert into public.payroll_items (
    payroll_id, assignment_id, attendance_record_id, regular_minutes, overtime_minutes, amount
  ) values (
    payroll.id, p_assignment_id, null, regular_minutes, overtime_minutes, payment
  );

  update public.monthly_payrolls p
     set total_amount = coalesce(
       (select sum(amount) from public.payroll_items where payroll_id = p.id and voided_at is null), 0
     )
   where p.id = payroll.id;
end;
$$;

-- 4. Attendance confirmation RPCs are no longer reachable.
drop function if exists public.confirm_attendance_and_payroll(
  uuid, uuid, timestamptz, public.attendance_status, timestamptz, timestamptz, text
);
drop function if exists private.confirm_attendance_and_payroll(
  uuid, public.attendance_status, timestamptz, timestamptz, text
);

-- 5. update_daily_schedule: drop the attendance lock/guard and create payroll for every
-- newly inserted assignment. The shift's own start/end time update is moved ahead of the
-- assignment insert loop so newly created payroll items use the shift's latest times.
create or replace function public.update_daily_schedule(
  p_request_id uuid,
  p_shift_id uuid,
  p_expected_shift_updated_at timestamptz,
  p_ceremony_count smallint,
  p_start_time time,
  p_end_time time,
  p_assignments jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  request_record private.daily_schedule_mutation_requests;
  shift_record public.shifts;
  position_record public.positions;
  assignment_json jsonb;
  payload_hash_value text;
  result_value jsonb;
  affected_worker_ids uuid[];
  worker_id_value uuid;
  position_id_value text;
  slot_index_value integer;
  base_count integer;
  extra_count integer;
  cancelled_count integer := 0;
  inserted_count integer := 0;
  notification_count integer := 0;
  new_assignment_id uuid;
begin
  if caller_id is null or not private.is_active_user(caller_id) or not private.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if p_request_id is null or p_shift_id is null or p_expected_shift_updated_at is null
     or p_ceremony_count is null or p_ceremony_count < 1
     or p_start_time is null or p_end_time is null or p_end_time <= p_start_time
     or jsonb_typeof(p_assignments) is distinct from 'array' then
    raise exception 'INVALID_INPUT';
  end if;

  payload_hash_value := encode(extensions.digest(convert_to(jsonb_build_object(
    'shift_id', p_shift_id, 'expected', p_expected_shift_updated_at,
    'ceremony_count', p_ceremony_count, 'start_time', p_start_time,
    'end_time', p_end_time, 'assignments', p_assignments
  )::text, 'UTF8'), 'sha256'), 'hex');
  insert into private.daily_schedule_mutation_requests
    (request_id, requested_by, operation, target_id, payload_hash)
  values (p_request_id, caller_id, 'update_schedule', p_shift_id, payload_hash_value)
  on conflict (request_id) do nothing;
  select * into request_record from private.daily_schedule_mutation_requests
    where request_id = p_request_id for update;
  if request_record.requested_by <> caller_id
     or request_record.operation <> 'update_schedule'
     or request_record.target_id <> p_shift_id
     or request_record.payload_hash <> payload_hash_value then
    raise exception 'IDEMPOTENCY_KEY_REUSED';
  end if;
  if request_record.result is not null then return request_record.result; end if;

  select * into shift_record from public.shifts where id = p_shift_id for update;
  if not found then raise exception 'SHIFT_NOT_FOUND'; end if;
  if shift_record.updated_at <> p_expected_shift_updated_at then raise exception 'STALE_SHIFT'; end if;
  if shift_record.status <> 'published' then raise exception 'SHIFT_NOT_EDITABLE'; end if;
  perform 1 from public.shift_assignments where shift_id = p_shift_id for update;

  if jsonb_array_length(p_assignments) < 10
     or exists (
       select 1 from jsonb_array_elements(p_assignments) assignment
       where jsonb_typeof(assignment) is distinct from 'object'
          or coalesce(assignment ->> 'workerId', '') !~ '^[0-9a-fA-F-]{36}$'
          or coalesce(assignment ->> 'positionId', '') = ''
          or coalesce(assignment ->> 'slotIndex', '') !~ '^[0-2]$'
          or assignment ->> 'slotKind' not in ('base', 'extra-training')
          or jsonb_typeof(assignment -> 'isTraining') is distinct from 'boolean'
     )
  then raise exception 'INVALID_ASSIGNMENT'; end if;
  if (select count(*) from jsonb_array_elements(p_assignments))
     <> (select count(distinct assignment ->> 'workerId') from jsonb_array_elements(p_assignments) assignment)
  then raise exception 'DUPLICATE_WORKER'; end if;
  if (select count(distinct assignment ->> 'positionId') from jsonb_array_elements(p_assignments) assignment) <> 8
  then raise exception 'INVALID_CAPACITY'; end if;

  for position_record in select * from public.positions order by id
  loop
    select
      count(*) filter (where assignment ->> 'slotKind' = 'base'),
      count(*) filter (where assignment ->> 'slotKind' = 'extra-training')
      into base_count, extra_count
    from jsonb_array_elements(p_assignments) assignment
    where assignment ->> 'positionId' = position_record.id;
    if base_count <> position_record.default_assignee_count or extra_count > 1
       or exists (
         select 1 from generate_series(0, position_record.default_assignee_count - 1) expected(slot_index)
         where not exists (
           select 1 from jsonb_array_elements(p_assignments) assignment
           where assignment ->> 'positionId' = position_record.id
             and assignment ->> 'slotKind' = 'base'
             and (assignment ->> 'slotIndex')::integer = expected.slot_index
         )
       )
    then raise exception 'INVALID_CAPACITY'; end if;
    if exists (
      select 1 from jsonb_array_elements(p_assignments) assignment
      where assignment ->> 'positionId' = position_record.id
        and assignment ->> 'slotKind' = 'extra-training'
        and (
          (assignment ->> 'isTraining')::boolean is false
          or (assignment ->> 'slotIndex')::integer <> position_record.default_assignee_count
        )
    ) then raise exception 'EXTRA_SLOT_MUST_BE_TRAINING'; end if;
  end loop;
  if exists (
    select 1 from jsonb_array_elements(p_assignments) assignment
    left join public.positions position on position.id = assignment ->> 'positionId'
    left join public.profiles profile on profile.id = (assignment ->> 'workerId')::uuid
    where position.id is null or profile.id is null or not profile.is_active or profile.hourly_wage <= 0
  ) then raise exception 'WORKER_INACTIVE_OR_WAGE_MISSING'; end if;

  if exists (
    select 1
      from jsonb_array_elements(p_assignments) assignment
     where not exists (
       select 1
         from public.shift_assignments existing
        where existing.shift_id = p_shift_id
          and existing.status = 'confirmed'
          and existing.worker_id = (assignment ->> 'workerId')::uuid
     )
       and not exists (
         select 1
           from public.schedule_applications application
          where application.application_period_id = shift_record.application_period_id
            and application.work_date = shift_record.work_date
            and application.worker_id = (assignment ->> 'workerId')::uuid
            and application.status = 'applied'
       )
  ) then raise exception 'WORKER_NOT_APPLIED'; end if;

  select coalesce(array_agg(distinct worker_id), '{}'::uuid[]) into affected_worker_ids
    from public.shift_assignments where shift_id = p_shift_id and status = 'confirmed';

  -- Apply the shift's own field changes before creating new payroll items so that
  -- newly inserted assignments below are paid using the latest start/end time.
  update public.shifts set ceremony_count = p_ceremony_count,
    start_time = p_start_time, end_time = p_end_time
    where id = p_shift_id returning * into shift_record;

  update public.payroll_items
     set voided_at = now(), voided_by = caller_id, void_reason = 'schedule_updated'
   where assignment_id in (
     select id from public.shift_assignments
      where shift_id = p_shift_id and status = 'confirmed'
        and not exists (
          select 1 from jsonb_array_elements(p_assignments) candidate
          where (candidate ->> 'workerId')::uuid = worker_id
            and candidate ->> 'positionId' = position_id
            and (candidate ->> 'slotIndex')::integer = slot_index
            and (candidate ->> 'isTraining')::boolean = is_training
        )
   ) and voided_at is null;

  update public.shift_assignments existing
    set status = 'cancelled', cancelled_at = now(), cancelled_by = caller_id
    where existing.shift_id = p_shift_id and existing.status = 'confirmed'
      and not exists (
        select 1 from jsonb_array_elements(p_assignments) candidate
        where (candidate ->> 'workerId')::uuid = existing.worker_id
          and candidate ->> 'positionId' = existing.position_id
          and (candidate ->> 'slotIndex')::integer = existing.slot_index
          and (candidate ->> 'isTraining')::boolean = existing.is_training
      );
  get diagnostics cancelled_count = row_count;

  for assignment_json in select value from jsonb_array_elements(p_assignments)
  loop
    worker_id_value := (assignment_json ->> 'workerId')::uuid;
    position_id_value := assignment_json ->> 'positionId';
    slot_index_value := (assignment_json ->> 'slotIndex')::integer;
    affected_worker_ids := array_append(affected_worker_ids, worker_id_value);
    new_assignment_id := null;
    if not exists (
      select 1 from public.shift_assignments
      where shift_id = p_shift_id and status = 'confirmed'
        and worker_id = worker_id_value and position_id = position_id_value
        and slot_index = slot_index_value
        and is_training = (assignment_json ->> 'isTraining')::boolean
    ) then
      insert into public.shift_assignments (
        shift_id, worker_id, position_id, slot_index, is_training,
        hourly_wage_snapshot, status, assigned_by, confirmed_at
      )
      select p_shift_id, profile.id, position_id_value, slot_index_value,
        (assignment_json ->> 'isTraining')::boolean, profile.hourly_wage,
        'confirmed', caller_id, now()
      from public.profiles profile where profile.id = worker_id_value
      returning id into new_assignment_id;
      inserted_count := inserted_count + 1;
      perform private.create_payroll_for_assignment(new_assignment_id, caller_id);
    end if;
  end loop;

  insert into public.notification_logs (
    recipient_id, shift_id, assignment_id, type, channel, delivery_status, correlation_id
  )
  select distinct profile.id, p_shift_id, null::uuid,
    'schedule_changed'::public.notification_type,
    'kakao_alimtalk'::text,
    'pending'::public.notification_delivery_status,
    p_request_id
  from public.profiles profile
  where profile.id = any(affected_worker_ids) and profile.kakao_consent;
  get diagnostics notification_count = row_count;

  result_value := jsonb_build_object(
    'shiftId', p_shift_id, 'shiftUpdatedAt', shift_record.updated_at,
    'cancelledAssignmentCount', cancelled_count, 'insertedAssignmentCount', inserted_count,
    'pendingNotificationCount', notification_count
  );
  update private.daily_schedule_mutation_requests set result = result_value, completed_at = now()
    where request_id = p_request_id;
  return result_value;
end;
$$;

-- 6. cancel_daily_schedule: drop the attendance lock/guard and void payroll items for
-- the confirmed assignments before cancelling them.
create or replace function public.cancel_daily_schedule(
  p_request_id uuid,
  p_shift_id uuid,
  p_expected_shift_updated_at timestamptz,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  request_record private.daily_schedule_mutation_requests;
  shift_record public.shifts;
  payload_hash_value text;
  result_value jsonb;
  assignment_count integer;
  notification_count integer;
begin
  if caller_id is null or not private.is_active_user(caller_id) or not private.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if p_request_id is null or p_shift_id is null or p_expected_shift_updated_at is null
     or char_length(trim(coalesce(p_reason, ''))) not between 2 and 500
  then raise exception 'INVALID_INPUT'; end if;
  payload_hash_value := encode(extensions.digest(convert_to(jsonb_build_object(
    'shift_id', p_shift_id, 'expected', p_expected_shift_updated_at, 'reason', trim(p_reason)
  )::text, 'UTF8'), 'sha256'), 'hex');
  insert into private.daily_schedule_mutation_requests
    (request_id, requested_by, operation, target_id, payload_hash)
  values (p_request_id, caller_id, 'cancel_schedule', p_shift_id, payload_hash_value)
  on conflict (request_id) do nothing;
  select * into request_record from private.daily_schedule_mutation_requests
    where request_id = p_request_id for update;
  if request_record.requested_by <> caller_id or request_record.operation <> 'cancel_schedule'
     or request_record.target_id <> p_shift_id or request_record.payload_hash <> payload_hash_value
  then raise exception 'IDEMPOTENCY_KEY_REUSED'; end if;
  if request_record.result is not null then return request_record.result; end if;
  select * into shift_record from public.shifts where id = p_shift_id for update;
  if not found then raise exception 'SHIFT_NOT_FOUND'; end if;
  if shift_record.updated_at <> p_expected_shift_updated_at then raise exception 'STALE_SHIFT'; end if;
  if shift_record.status <> 'published' then raise exception 'SHIFT_NOT_CANCELLABLE'; end if;
  perform 1 from public.shift_assignments where shift_id = p_shift_id for update;

  update public.payroll_items
     set voided_at = now(), voided_by = caller_id, void_reason = 'schedule_cancelled'
   where assignment_id in (
     select id from public.shift_assignments where shift_id = p_shift_id and status = 'confirmed'
   ) and voided_at is null;

  insert into public.notification_logs (
    recipient_id, shift_id, assignment_id, type, channel, delivery_status, correlation_id
  )
  select assignment.worker_id, p_shift_id, assignment.id, 'schedule_cancelled',
    'kakao_alimtalk', 'pending', p_request_id
  from public.shift_assignments assignment
  join public.profiles profile on profile.id = assignment.worker_id
  where assignment.shift_id = p_shift_id and assignment.status = 'confirmed'
    and profile.kakao_consent;
  get diagnostics notification_count = row_count;
  update public.shift_assignments set status = 'cancelled', cancelled_at = now(),
    cancelled_by = caller_id where shift_id = p_shift_id and status = 'confirmed';
  get diagnostics assignment_count = row_count;
  update public.shifts set status = 'cancelled', cancelled_at = now(),
    cancelled_by = caller_id, cancellation_reason = trim(p_reason)
    where id = p_shift_id returning * into shift_record;
  result_value := jsonb_build_object(
    'shiftId', p_shift_id, 'shiftUpdatedAt', shift_record.updated_at,
    'cancelledAssignmentCount', assignment_count, 'pendingNotificationCount', notification_count
  );
  update private.daily_schedule_mutation_requests set result = result_value, completed_at = now()
    where request_id = p_request_id;
  return result_value;
end;
$$;

-- 7. Monthly registration also confirms assignments directly, so it must create the
-- matching payroll item for each newly confirmed assignment.
create or replace function private.save_monthly_schedule_registration(
  p_request_id uuid,
  p_year_month date,
  p_application_deadline timestamptz,
  p_expected_period_updated_at timestamptz,
  p_schedules jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  request_record private.schedule_registration_requests;
  period_record public.schedule_application_periods;
  schedule_json jsonb;
  assignment_json jsonb;
  position_record public.positions;
  created_shift_id uuid;
  created_assignment_id uuid;
  payload_hash_value text;
  result_value jsonb;
  published_count integer := 0;
  assignment_count integer := 0;
  notification_count integer := 0;
  inserted_notifications integer := 0;
  work_date_value date;
  position_id_value text;
  worker_id_value uuid;
  slot_index_value integer;
  ceremony_count_value integer;
  base_count integer;
  extra_count integer;
begin
  if caller_id is null or not private.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  if p_request_id is null
     or p_year_month is null
     or extract(day from p_year_month) <> 1
     or p_application_deadline is null
     or jsonb_typeof(p_schedules) is distinct from 'array' then
    raise exception 'INVALID_INPUT';
  end if;

  if jsonb_array_length(p_schedules) = 0 then
    raise exception 'INVALID_INPUT';
  end if;

  payload_hash_value := encode(
    extensions.digest(
      convert_to(
        jsonb_build_object(
          'year_month', p_year_month,
          'application_deadline', p_application_deadline,
          'expected_period_updated_at', p_expected_period_updated_at,
          'schedules', p_schedules
        )::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );

  insert into private.schedule_registration_requests (
    request_id,
    requested_by,
    year_month,
    payload_hash
  )
  values (p_request_id, caller_id, p_year_month, payload_hash_value)
  on conflict (request_id) do nothing;

  select *
    into request_record
    from private.schedule_registration_requests
   where request_id = p_request_id
   for update;

  if request_record.requested_by <> caller_id
     or request_record.year_month <> p_year_month
     or request_record.payload_hash <> payload_hash_value then
    raise exception 'IDEMPOTENCY_KEY_REUSED';
  end if;

  if request_record.result is not null then
    return request_record.result;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_year_month::text, 0));

  select *
    into period_record
    from public.schedule_application_periods
   where year_month = p_year_month
   for update;

  if found then
    if p_expected_period_updated_at is null
       or period_record.updated_at <> p_expected_period_updated_at then
      raise exception 'STALE_PERIOD';
    end if;

    update public.schedule_application_periods
       set application_deadline = p_application_deadline,
           managed_by = caller_id
     where id = period_record.id
    returning * into period_record;
  else
    if p_expected_period_updated_at is not null then
      raise exception 'STALE_PERIOD';
    end if;

    insert into public.schedule_application_periods (
      year_month,
      application_deadline,
      status,
      managed_by
    )
    values (p_year_month, p_application_deadline, 'open', caller_id)
    returning * into period_record;
  end if;

  if (
    select count(*)
    from jsonb_array_elements(p_schedules) schedule
  ) <> (
    select count(distinct schedule ->> 'workDate')
    from jsonb_array_elements(p_schedules) schedule
  ) then
    raise exception 'INVALID_DATE';
  end if;

  for schedule_json in select value from jsonb_array_elements(p_schedules)
  loop
    if jsonb_typeof(schedule_json) is distinct from 'object'
       or jsonb_typeof(schedule_json -> 'workDate') is distinct from 'string'
       or (schedule_json ->> 'workDate') !~ '^\d{4}-\d{2}-\d{2}$' then
      raise exception 'INVALID_DATE';
    end if;

    begin
      work_date_value := (schedule_json ->> 'workDate')::date;
    exception when others then
      raise exception 'INVALID_DATE';
    end;

    if work_date_value < p_year_month
       or work_date_value >= (p_year_month + interval '1 month')::date
       or extract(isodow from work_date_value) not in (6, 7) then
      raise exception 'INVALID_DATE';
    end if;

    if exists (select 1 from public.shifts where work_date = work_date_value) then
      raise exception 'DATE_ALREADY_REGISTERED';
    end if;

    if jsonb_typeof(schedule_json -> 'ceremonyCount') is distinct from 'number'
       or (schedule_json ->> 'ceremonyCount') !~ '^\d+$'
       or length(schedule_json ->> 'ceremonyCount') > 5
       or jsonb_typeof(schedule_json -> 'startTime') is distinct from 'string'
       or jsonb_typeof(schedule_json -> 'endTime') is distinct from 'string'
       or (schedule_json ->> 'startTime') !~ '^([01]\d|2[0-3]):[0-5]\d$'
       or (schedule_json ->> 'endTime') !~ '^([01]\d|2[0-3]):[0-5]\d$' then
      raise exception 'INVALID_INPUT';
    end if;

    begin
      ceremony_count_value := (schedule_json ->> 'ceremonyCount')::integer;
    exception
      when invalid_text_representation or numeric_value_out_of_range then
        raise exception 'INVALID_INPUT';
    end;

    if ceremony_count_value not between 1 and 32767 then
      raise exception 'INVALID_INPUT';
    end if;

    begin
      if (schedule_json ->> 'startTime')::time >= (schedule_json ->> 'endTime')::time then
        raise exception 'INVALID_INPUT';
      end if;
    exception
      when invalid_datetime_format or datetime_field_overflow then
        raise exception 'INVALID_INPUT';
    end;

    if jsonb_typeof(schedule_json -> 'assignments') is distinct from 'array' then
      raise exception 'INVALID_CAPACITY';
    end if;

    for assignment_json in select value from jsonb_array_elements(schedule_json -> 'assignments')
    loop
      if jsonb_typeof(assignment_json) is distinct from 'object'
         or jsonb_typeof(assignment_json -> 'workerId') is distinct from 'string'
         or (assignment_json ->> 'workerId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
         or jsonb_typeof(assignment_json -> 'positionId') is distinct from 'string'
         or jsonb_typeof(assignment_json -> 'slotIndex') is distinct from 'number'
         or (assignment_json ->> 'slotIndex') !~ '^[0-2]$'
         or jsonb_typeof(assignment_json -> 'slotKind') is distinct from 'string'
         or assignment_json ->> 'slotKind' not in ('base', 'extra-training')
         or jsonb_typeof(assignment_json -> 'isTraining') is distinct from 'boolean' then
        raise exception 'INVALID_INPUT';
      end if;
    end loop;

    if (
      select count(*)
      from (
        select assignment ->> 'workerId'
        from jsonb_array_elements(schedule_json -> 'assignments') assignment
        group by assignment ->> 'workerId'
        having count(*) > 1
      ) duplicate_workers
    ) > 0 then
      raise exception 'DUPLICATE_WORKER';
    end if;

    for position_record in select * from public.positions order by id
    loop
      select
        count(*) filter (where assignment ->> 'slotKind' = 'base'),
        count(*) filter (where assignment ->> 'slotKind' = 'extra-training')
        into base_count, extra_count
      from jsonb_array_elements(schedule_json -> 'assignments') assignment
      where assignment ->> 'positionId' = position_record.id;

      if base_count <> position_record.default_assignee_count
         or extra_count > 1
         or exists (
           select 1
           from generate_series(0, position_record.default_assignee_count - 1) expected(slot_index)
           where not exists (
             select 1
             from jsonb_array_elements(schedule_json -> 'assignments') assignment
             where assignment ->> 'positionId' = position_record.id
               and assignment ->> 'slotKind' = 'base'
               and (assignment ->> 'slotIndex')::integer = expected.slot_index
           )
         ) then
        raise exception 'INVALID_CAPACITY';
      end if;

      if exists (
        select 1
        from jsonb_array_elements(schedule_json -> 'assignments') assignment
        where assignment ->> 'positionId' = position_record.id
          and assignment ->> 'slotKind' = 'extra-training'
          and (
            coalesce((assignment ->> 'isTraining')::boolean, false) is false
            or (assignment ->> 'slotIndex')::integer <> position_record.default_assignee_count
          )
      ) then
        raise exception 'EXTRA_SLOT_MUST_BE_TRAINING';
      end if;
    end loop;

    if (
      select count(distinct assignment ->> 'positionId')
      from jsonb_array_elements(schedule_json -> 'assignments') assignment
    ) <> 8
       or exists (
         select 1
         from jsonb_array_elements(schedule_json -> 'assignments') assignment
         where not exists (
           select 1 from public.positions
           where id = assignment ->> 'positionId'
         )
       ) then
      raise exception 'INVALID_CAPACITY';
    end if;

    insert into public.shifts (
      application_period_id,
      work_date,
      start_time,
      end_time,
      ceremony_count,
      status,
      created_by
    )
    values (
      period_record.id,
      work_date_value,
      (schedule_json ->> 'startTime')::time,
      (schedule_json ->> 'endTime')::time,
      ceremony_count_value::smallint,
      'published',
      caller_id
    )
    returning id into created_shift_id;
    published_count := published_count + 1;

    for assignment_json in
      select value
      from jsonb_array_elements(schedule_json -> 'assignments')
      order by value ->> 'positionId', (value ->> 'slotIndex')::integer
    loop
      position_id_value := assignment_json ->> 'positionId';
      worker_id_value := (assignment_json ->> 'workerId')::uuid;
      slot_index_value := (assignment_json ->> 'slotIndex')::integer;

      if not exists (
        select 1
        from public.profiles
        where id = worker_id_value
          and is_active
      ) then
        raise exception 'WORKER_INACTIVE';
      end if;

      if not exists (
        select 1
        from public.profiles
        where id = worker_id_value
          and hourly_wage > 0
      ) then
        raise exception 'WAGE_NOT_CONFIGURED';
      end if;

      insert into public.shift_assignments (
        shift_id,
        worker_id,
        position_id,
        slot_index,
        is_training,
        hourly_wage_snapshot,
        status,
        assigned_by,
        confirmed_at
      )
      select
        created_shift_id,
        profile.id,
        position_id_value,
        slot_index_value,
        coalesce((assignment_json ->> 'isTraining')::boolean, false),
        profile.hourly_wage,
        'confirmed',
        caller_id,
        now()
      from public.profiles profile
      where profile.id = worker_id_value
      returning id into created_assignment_id;

      assignment_count := assignment_count + 1;

      perform private.create_payroll_for_assignment(created_assignment_id, caller_id);

      insert into public.notification_logs (
        recipient_id,
        shift_id,
        assignment_id,
        type,
        channel,
        delivery_status,
        correlation_id
      )
      select
        profile.id,
        created_shift_id,
        created_assignment_id,
        'schedule_confirmed',
        'kakao_alimtalk',
        'pending',
        p_request_id
      from public.profiles profile
      where profile.id = worker_id_value
        and profile.kakao_consent
      on conflict (assignment_id, type, channel)
        where assignment_id is not null
          and type = 'schedule_confirmed'
        do nothing;

      get diagnostics inserted_notifications = row_count;
      notification_count := notification_count + inserted_notifications;
    end loop;
  end loop;

  result_value := jsonb_build_object(
    'requestId', p_request_id,
    'periodId', period_record.id,
    'periodUpdatedAt', period_record.updated_at,
    'publishedScheduleCount', published_count,
    'confirmedAssignmentCount', assignment_count,
    'pendingNotificationCount', notification_count
  );

  update private.schedule_registration_requests
     set result = result_value,
         completed_at = now()
   where request_id = p_request_id;

  return result_value;
end;
$$;

-- 8. The daily schedule mutation request ledger no longer accepts attendance confirmations.
alter table private.daily_schedule_mutation_requests
  drop constraint if exists daily_schedule_mutation_requests_operation_check;
alter table private.daily_schedule_mutation_requests
  add constraint daily_schedule_mutation_requests_operation_check
  check (operation in ('update_schedule', 'cancel_schedule'));

-- 9. Only the RPCs above may call the payroll helper.
revoke all on function private.create_payroll_for_assignment(uuid, uuid) from public, anon, authenticated;
