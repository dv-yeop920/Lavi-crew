-- Allow an active administrator to publish a complete monthly schedule while the
-- worker application period is still open. The stored period version and deadline,
-- applicant eligibility, payload structure, and atomic write guarantees remain enforced.

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
  period_record public.schedule_application_periods;
  result_value jsonb;
begin
  if auth.uid() is null or not private.is_active_user() or not private.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  select *
    into period_record
    from public.schedule_application_periods
   where year_month = p_year_month
   for update;

  if not found then raise exception 'PERIOD_NOT_FOUND'; end if;

  -- Completed requests must replay before current-state validation.
  if exists (
    select 1
      from private.schedule_registration_requests
     where request_id = p_request_id
       and result is not null
  ) then
    return private.save_monthly_schedule_registration(
      p_request_id, p_year_month, p_application_deadline,
      p_expected_period_updated_at, p_schedules
    );
  end if;

  if p_expected_period_updated_at is null
     or period_record.updated_at <> p_expected_period_updated_at then
    raise exception 'STALE_PERIOD';
  end if;
  if p_application_deadline is null
     or p_application_deadline <> period_record.application_deadline then
    raise exception 'PERIOD_DEADLINE_MISMATCH';
  end if;

  result_value := private.save_monthly_schedule_registration(
    p_request_id, p_year_month, period_record.application_deadline,
    p_expected_period_updated_at, p_schedules
  );

  -- The private function validates the JSON shape before this traversal. Raising here
  -- rolls back all shifts, assignments, notifications, and the idempotency record.
  if exists (
    select 1
      from jsonb_array_elements(p_schedules) schedule
      cross join lateral jsonb_array_elements(schedule -> 'assignments') assignment
     where not exists (
       select 1
         from public.schedule_applications application
        where application.application_period_id = period_record.id
          and application.work_date = (schedule ->> 'workDate')::date
          and application.worker_id = (assignment ->> 'workerId')::uuid
          and application.status = 'applied'
     )
  ) then
    raise exception 'WORKER_NOT_APPLIED';
  end if;

  return result_value;
end;
$$;
