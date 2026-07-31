-- Fix Postgres resolving the polymorphic NULL in the DISTINCT projection as text.
CREATE OR REPLACE FUNCTION public.update_daily_schedule(p_request_id uuid, p_shift_id uuid, p_expected_shift_updated_at timestamp with time zone, p_ceremony_count smallint, p_start_time time without time zone, p_end_time time without time zone, p_assignments jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  perform 1 from public.attendance_records attendance
    join public.shift_assignments assignment on assignment.id = attendance.assignment_id
    where assignment.shift_id = p_shift_id for update of attendance;
  if exists (
    select 1 from public.attendance_records attendance
    join public.shift_assignments assignment on assignment.id = attendance.assignment_id
    where assignment.shift_id = p_shift_id and attendance.confirmed_at is not null
  ) then raise exception 'ATTENDANCE_ALREADY_CONFIRMED'; end if;

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

  select coalesce(array_agg(distinct worker_id), '{}'::uuid[]) into affected_worker_ids
    from public.shift_assignments where shift_id = p_shift_id and status = 'confirmed';
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
      from public.profiles profile where profile.id = worker_id_value;
      inserted_count := inserted_count + 1;
    end if;
  end loop;

  update public.shifts set ceremony_count = p_ceremony_count,
    start_time = p_start_time, end_time = p_end_time
    where id = p_shift_id returning * into shift_record;
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
$function$;
