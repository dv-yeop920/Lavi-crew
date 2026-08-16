-- Cancel (delete) a schedule application period and its applications.
-- Allowed only when no shifts reference the period.

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

  if exists (select 1 from public.shifts where application_period_id = p_period_id) then
    raise exception 'PERIOD_HAS_SCHEDULE_HISTORY';
  end if;

  delete from public.schedule_applications where application_period_id = p_period_id;
  get diagnostics deleted_application_count = row_count;

  delete from public.schedule_application_periods where id = p_period_id;

  result_value := jsonb_build_object(
    'periodId', p_period_id,
    'deletedApplicationCount', deleted_application_count
  );
  update private.schedule_application_mutation_requests
    set result = result_value, completed_at = now() where request_id = p_request_id;
  return result_value;
end;
$$;

revoke all on function public.cancel_schedule_application_period(uuid, uuid, timestamptz)
  from public, anon;
grant execute on function public.cancel_schedule_application_period(uuid, uuid, timestamptz)
  to authenticated;
