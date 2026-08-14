alter table public.shift_assignments
  add column slot_index smallint;

do $$
begin
  if exists (
    select 1
    from public.shift_assignments assignment
    join public.positions position on position.id = assignment.position_id
    where assignment.status <> 'cancelled'
    group by assignment.shift_id, assignment.position_id, position.default_assignee_count
    having count(*) > position.default_assignee_count + 1
  ) then
    raise exception 'MIGRATION_BLOCKED_ACTIVE_CAPACITY';
  end if;
end;
$$;

with ranked_assignments as (
  select
    id,
    row_number() over (
      partition by shift_id, position_id
      order by created_at, id
    ) - 1 as next_slot_index
  from public.shift_assignments
  where status <> 'cancelled'
)
update public.shift_assignments assignment
set slot_index = ranked.next_slot_index
from ranked_assignments ranked
where ranked.id = assignment.id;

update public.shift_assignments
set slot_index = 0
where status = 'cancelled';

alter table public.shift_assignments
  alter column slot_index set not null,
  add constraint shift_assignments_slot_index_check
    check (slot_index between 0 and 2);

create unique index active_assignment_position_slot_idx
  on public.shift_assignments (shift_id, position_id, slot_index)
  where status <> 'cancelled';

alter table public.notification_logs
  add column correlation_id uuid;

do $$
begin
  if exists (
    select 1
    from public.notification_logs
    where assignment_id is not null
      and type = 'schedule_confirmed'
    group by assignment_id, type, channel
    having count(*) > 1
  ) then
    raise exception 'MIGRATION_BLOCKED_DUPLICATE_NOTIFICATIONS';
  end if;
end;
$$;

create unique index notification_logs_initial_confirmation_idx
  on public.notification_logs (assignment_id, type, channel)
  where assignment_id is not null
    and type = 'schedule_confirmed';

create table private.schedule_registration_requests (
  request_id uuid primary key,
  requested_by uuid not null references public.profiles(id) on delete restrict,
  year_month date not null check (extract(day from year_month) = 1),
  payload_hash text not null,
  result jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

revoke all on table private.schedule_registration_requests from public, anon, authenticated;

create or replace function public.save_monthly_schedule_registration(
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
        worker_id_value,
        created_shift_id,
        created_assignment_id,
        'schedule_confirmed',
        'web_push',
        'pending',
        p_request_id
      where exists (
        select 1 from public.push_subscriptions ps where ps.user_id = worker_id_value
      )
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

drop policy if exists "admin inserts periods" on public.schedule_application_periods;
drop policy if exists "admin updates periods" on public.schedule_application_periods;
drop policy if exists "admin inserts shifts" on public.shifts;
drop policy if exists "admin updates shifts" on public.shifts;
drop policy if exists "admin inserts assignments" on public.shift_assignments;
drop policy if exists "admin updates assignments" on public.shift_assignments;
drop policy if exists "admin inserts notifications" on public.notification_logs;
drop policy if exists "admin updates notifications" on public.notification_logs;

revoke insert, update, delete on public.schedule_application_periods from authenticated;
revoke insert, update, delete on public.shifts from authenticated;
revoke insert, update, delete on public.shift_assignments from authenticated;
revoke insert, update, delete on public.notification_logs from authenticated;

revoke all on function public.save_monthly_schedule_registration(
  uuid,
  date,
  timestamptz,
  timestamptz,
  jsonb
) from public, anon;

grant execute on function public.save_monthly_schedule_registration(
  uuid,
  date,
  timestamptz,
  timestamptz,
  jsonb
) to authenticated;
