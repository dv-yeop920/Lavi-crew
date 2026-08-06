create or replace function public.confirm_attendance_and_payroll(
  p_request_id uuid,
  p_record_id uuid,
  p_expected_attendance_updated_at timestamptz,
  p_next_status public.attendance_status,
  p_actual_start timestamptz default null,
  p_actual_end timestamptz default null,
  p_correction_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  request_record private.daily_schedule_mutation_requests;
  attendance_record public.attendance_records;
  payload_hash_value text;
  result_value jsonb;
begin
  if caller_id is null or not private.is_active_user(caller_id) or not private.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if p_request_id is null or p_record_id is null or p_expected_attendance_updated_at is null
  then raise exception 'INVALID_INPUT'; end if;
  payload_hash_value := encode(extensions.digest(convert_to(jsonb_build_object(
    'record_id', p_record_id, 'expected', p_expected_attendance_updated_at,
    'status', p_next_status, 'actual_start', p_actual_start, 'actual_end', p_actual_end,
    'correction_note', nullif(trim(p_correction_note), '')
  )::text, 'UTF8'), 'sha256'), 'hex');
  insert into private.daily_schedule_mutation_requests
    (request_id, requested_by, operation, target_id, payload_hash)
  values (p_request_id, caller_id, 'confirm_attendance', p_record_id, payload_hash_value)
  on conflict (request_id) do nothing;
  select * into request_record from private.daily_schedule_mutation_requests
    where request_id = p_request_id for update;
  if request_record.requested_by <> caller_id or request_record.operation <> 'confirm_attendance'
     or request_record.target_id <> p_record_id or request_record.payload_hash <> payload_hash_value
  then raise exception 'IDEMPOTENCY_KEY_REUSED'; end if;
  if request_record.result is not null then return request_record.result; end if;
  select * into attendance_record from public.attendance_records
    where id = p_record_id for update;
  if not found then raise exception 'ATTENDANCE_NOT_FOUND'; end if;
  if attendance_record.updated_at <> p_expected_attendance_updated_at
  then raise exception 'STALE_ATTENDANCE'; end if;
  if attendance_record.confirmed_at is not null
     and attendance_record.status = p_next_status
     and attendance_record.actual_started_at is not distinct from p_actual_start
     and attendance_record.actual_ended_at is not distinct from p_actual_end
  then raise exception 'ATTENDANCE_UNCHANGED'; end if;
  perform private.confirm_attendance_and_payroll(
    p_record_id, p_next_status, p_actual_start, p_actual_end, p_correction_note
  );
  select * into attendance_record from public.attendance_records where id = p_record_id;
  result_value := jsonb_build_object(
    'attendanceId', attendance_record.id, 'status', attendance_record.status,
    'attendanceUpdatedAt', attendance_record.updated_at, 'confirmedAt', attendance_record.confirmed_at
  );
  update private.daily_schedule_mutation_requests set result = result_value, completed_at = now()
    where request_id = p_request_id;
  return result_value;
end;
$$;
