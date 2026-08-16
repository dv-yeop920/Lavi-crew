-- Allow cancel_schedule_application_period to cascade-delete shifts,
-- assignments, attendance records, and applications when no payroll
-- items exist for the period's assignments.

create or replace function public.cancel_schedule_application_period(
  p_request_id uuid,
  p_period_id uuid,
  p_expected_updated_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  request_record private.schedule_application_mutation_requests;
  period_record public.schedule_application_periods;
  payload_hash_value text;
  result_value jsonb;
  deleted_application_count integer;
  deleted_shift_count integer;
  deleted_assignment_count integer;
  shift_ids uuid[];
  assignment_ids uuid[];
begin
  if caller_id is null or not private.is_active_user(caller_id) or not private.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if p_request_id is null or p_period_id is null or p_expected_updated_at is null then
    raise exception 'INVALID_INPUT';
  end if;

  payload_hash_value := encode(extensions.digest(convert_to(jsonb_build_object(
    'period_id', p_period_id, 'expected', p_expected_updated_at
  )::text, 'UTF8'), 'sha256'), 'hex');
  insert into private.schedule_application_mutation_requests
    (request_id, requested_by, operation, payload_hash)
  values (p_request_id, caller_id, 'cancel_period', payload_hash_value)
  on conflict (request_id) do nothing;
  select * into request_record from private.schedule_application_mutation_requests
    where request_id = p_request_id for update;
  if request_record.requested_by <> caller_id or request_record.operation <> 'cancel_period'
     or request_record.payload_hash <> payload_hash_value then
    raise exception 'IDEMPOTENCY_KEY_REUSED';
  end if;
  if request_record.result is not null then return request_record.result; end if;

  select * into period_record from public.schedule_application_periods
    where id = p_period_id for update;
  if not found then raise exception 'PERIOD_NOT_FOUND'; end if;
  if period_record.updated_at <> p_expected_updated_at then raise exception 'STALE_PERIOD'; end if;

  select array_agg(id) into shift_ids
    from public.shifts where application_period_id = p_period_id;

  if shift_ids is not null then
    select array_agg(sa.id) into assignment_ids
      from public.shift_assignments sa
      where sa.shift_id = any(shift_ids);

    if assignment_ids is not null then
      if exists (
        select 1 from public.payroll_items
          where assignment_id = any(assignment_ids)
      ) then
        raise exception 'PERIOD_HAS_PAYROLL_HISTORY';
      end if;

      delete from public.notification_logs
        where assignment_id = any(assignment_ids) or shift_id = any(shift_ids);

      delete from public.attendance_records
        where assignment_id = any(assignment_ids);

      delete from public.shift_assignments
        where id = any(assignment_ids);
      get diagnostics deleted_assignment_count = row_count;
    else
      delete from public.notification_logs
        where shift_id = any(shift_ids);
    end if;

    delete from public.shifts where id = any(shift_ids);
    get diagnostics deleted_shift_count = row_count;
  end if;

  delete from public.schedule_applications where application_period_id = p_period_id;
  get diagnostics deleted_application_count = row_count;

  delete from public.schedule_application_periods where id = p_period_id;

  result_value := jsonb_build_object(
    'periodId', p_period_id,
    'deletedApplicationCount', coalesce(deleted_application_count, 0),
    'deletedShiftCount', coalesce(deleted_shift_count, 0),
    'deletedAssignmentCount', coalesce(deleted_assignment_count, 0)
  );
  update private.schedule_application_mutation_requests
    set result = result_value, completed_at = now() where request_id = p_request_id;
  return result_value;
end;
$$;
