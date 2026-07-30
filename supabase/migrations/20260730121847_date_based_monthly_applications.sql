-- Date-based monthly applications.
-- Remote migration version: 20260730121847.
-- Safe expand/contract: the operational application tables were verified empty before authoring.

alter table private.schedule_registration_requests enable row level security;

drop policy if exists "workers or admin insert applications" on public.schedule_applications;
drop policy if exists "workers or admin update applications" on public.schedule_applications;
drop policy if exists "workers cancel own while open" on public.schedule_applications;
drop policy if exists "admin manages applications" on public.schedule_applications;
drop policy if exists "admin updates applications" on public.schedule_applications;

drop function if exists public.cancel_own_schedule_application(uuid);
drop function if exists public.close_application_period(uuid);

alter table public.schedule_applications
  add column application_period_id uuid references public.schedule_application_periods(id) on delete restrict,
  add column work_date date;

update public.schedule_applications application
set application_period_id = shift.application_period_id,
    work_date = shift.work_date
from public.shifts shift
where shift.id = application.shift_id;

do $$
begin
  if exists (
    select 1
    from public.schedule_applications
    where application_period_id is null or work_date is null
  ) then
    raise exception 'MIGRATION_BLOCKED_APPLICATION_BACKFILL';
  end if;
end;
$$;

alter table public.schedule_applications
  alter column application_period_id set not null,
  alter column work_date set not null,
  drop constraint schedule_applications_shift_id_worker_id_key,
  drop constraint schedule_applications_shift_id_fkey,
  drop column shift_id,
  add constraint schedule_applications_weekend_check
    check (extract(isodow from work_date) in (6, 7)),
  add constraint schedule_applications_cancelled_at_check
    check (
      (status = 'applied' and cancelled_at is null)
      or (status = 'cancelled' and cancelled_at is not null)
    ),
  add constraint schedule_applications_period_date_worker_key
    unique (application_period_id, work_date, worker_id);

drop index if exists public.applications_worker_status_idx;
create index schedule_applications_period_date_status_idx
  on public.schedule_applications (application_period_id, work_date, status);
create index schedule_applications_worker_status_date_idx
  on public.schedule_applications (worker_id, status, work_date);

revoke insert, update, delete on public.schedule_applications from anon, authenticated;
grant select on public.schedule_applications to authenticated;

create table private.schedule_application_mutation_requests (
  request_id uuid primary key,
  requested_by uuid not null references public.profiles(id) on delete restrict,
  operation text not null check (operation in ('save_period', 'set_period_status', 'save_applications')),
  payload_hash text not null,
  result jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table private.schedule_application_mutation_requests enable row level security;
revoke all on private.schedule_application_mutation_requests from public, anon, authenticated;

create or replace function public.save_schedule_application_period(
  p_request_id uuid,
  p_year_month date,
  p_application_deadline timestamptz,
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
begin
  if caller_id is null or not private.is_active_user(caller_id) or not private.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if p_request_id is null or p_year_month is null or extract(day from p_year_month) <> 1
     or p_application_deadline is null or p_application_deadline <= now()
     or (p_period_id is null) <> (p_expected_updated_at is null) then
    raise exception 'INVALID_INPUT';
  end if;

  payload_hash_value := encode(extensions.digest(convert_to(jsonb_build_object(
    'year_month', p_year_month, 'deadline', p_application_deadline,
    'period_id', p_period_id, 'expected', p_expected_updated_at
  )::text, 'UTF8'), 'sha256'), 'hex');
  insert into private.schedule_application_mutation_requests
    (request_id, requested_by, operation, payload_hash)
  values (p_request_id, caller_id, 'save_period', payload_hash_value)
  on conflict (request_id) do nothing;
  select * into request_record from private.schedule_application_mutation_requests
    where request_id = p_request_id for update;
  if request_record.requested_by <> caller_id or request_record.operation <> 'save_period'
     or request_record.payload_hash <> payload_hash_value then
    raise exception 'IDEMPOTENCY_KEY_REUSED';
  end if;
  if request_record.result is not null then return request_record.result; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_year_month::text, 0));
  if p_period_id is null then
    if exists (select 1 from public.schedule_application_periods where year_month = p_year_month) then
      raise exception 'STALE_PERIOD';
    end if;
    insert into public.schedule_application_periods
      (year_month, application_deadline, status, managed_by)
    values (p_year_month, p_application_deadline, 'open', caller_id)
    returning * into period_record;
  else
    select * into period_record from public.schedule_application_periods
      where id = p_period_id and year_month = p_year_month for update;
    if not found then raise exception 'PERIOD_NOT_FOUND'; end if;
    if period_record.updated_at <> p_expected_updated_at then raise exception 'STALE_PERIOD'; end if;
    update public.schedule_application_periods
      set application_deadline = p_application_deadline, managed_by = caller_id
      where id = period_record.id returning * into period_record;
  end if;

  result_value := jsonb_build_object(
    'periodId', period_record.id, 'status', period_record.status,
    'applicationDeadline', period_record.application_deadline,
    'updatedAt', period_record.updated_at
  );
  update private.schedule_application_mutation_requests
    set result = result_value, completed_at = now() where request_id = p_request_id;
  return result_value;
end;
$$;

create or replace function public.set_schedule_application_period_status(
  p_request_id uuid,
  p_period_id uuid,
  p_next_status public.application_period_status,
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
begin
  if caller_id is null or not private.is_active_user(caller_id) or not private.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if p_request_id is null or p_period_id is null or p_next_status is null
     or p_expected_updated_at is null then raise exception 'INVALID_INPUT'; end if;
  payload_hash_value := encode(extensions.digest(convert_to(jsonb_build_object(
    'period_id', p_period_id, 'next_status', p_next_status, 'expected', p_expected_updated_at
  )::text, 'UTF8'), 'sha256'), 'hex');
  insert into private.schedule_application_mutation_requests
    (request_id, requested_by, operation, payload_hash)
  values (p_request_id, caller_id, 'set_period_status', payload_hash_value)
  on conflict (request_id) do nothing;
  select * into request_record from private.schedule_application_mutation_requests
    where request_id = p_request_id for update;
  if request_record.requested_by <> caller_id or request_record.operation <> 'set_period_status'
     or request_record.payload_hash <> payload_hash_value then
    raise exception 'IDEMPOTENCY_KEY_REUSED';
  end if;
  if request_record.result is not null then return request_record.result; end if;

  select * into period_record from public.schedule_application_periods
    where id = p_period_id for update;
  if not found then raise exception 'PERIOD_NOT_FOUND'; end if;
  if period_record.updated_at <> p_expected_updated_at then raise exception 'STALE_PERIOD'; end if;
  if p_next_status = 'open' and (
    period_record.application_deadline <= now()
    or exists (select 1 from public.shifts where application_period_id = p_period_id)
  ) then raise exception 'PERIOD_CANNOT_BE_REOPENED'; end if;

  update public.schedule_application_periods
    set status = p_next_status,
        closed_at = case when p_next_status = 'closed' then now() else null end,
        managed_by = caller_id
    where id = p_period_id returning * into period_record;
  result_value := jsonb_build_object(
    'periodId', period_record.id, 'status', period_record.status,
    'applicationDeadline', period_record.application_deadline,
    'updatedAt', period_record.updated_at
  );
  update private.schedule_application_mutation_requests
    set result = result_value, completed_at = now() where request_id = p_request_id;
  return result_value;
end;
$$;

create or replace function public.save_own_monthly_schedule_applications(
  p_request_id uuid,
  p_period_id uuid,
  p_expected_period_updated_at timestamptz,
  p_selected_dates date[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_role public.app_role;
  request_record private.schedule_application_mutation_requests;
  period_record public.schedule_application_periods;
  normalized_dates date[];
  payload_hash_value text;
  result_value jsonb;
  applied_count integer;
  cancelled_count integer;
begin
  select role into caller_role from public.profiles
    where id = caller_id and is_active;
  if caller_id is null or caller_role is distinct from 'worker' then raise exception 'FORBIDDEN'; end if;
  if p_request_id is null or p_period_id is null or p_expected_period_updated_at is null
     or p_selected_dates is null then raise exception 'INVALID_INPUT'; end if;
  select coalesce(array_agg(distinct candidate order by candidate), '{}'::date[])
    into normalized_dates from unnest(p_selected_dates) candidate;
  payload_hash_value := encode(extensions.digest(convert_to(jsonb_build_object(
    'period_id', p_period_id, 'expected', p_expected_period_updated_at,
    'selected_dates', to_jsonb(normalized_dates)
  )::text, 'UTF8'), 'sha256'), 'hex');
  insert into private.schedule_application_mutation_requests
    (request_id, requested_by, operation, payload_hash)
  values (p_request_id, caller_id, 'save_applications', payload_hash_value)
  on conflict (request_id) do nothing;
  select * into request_record from private.schedule_application_mutation_requests
    where request_id = p_request_id for update;
  if request_record.requested_by <> caller_id or request_record.operation <> 'save_applications'
     or request_record.payload_hash <> payload_hash_value then
    raise exception 'IDEMPOTENCY_KEY_REUSED';
  end if;
  if request_record.result is not null then return request_record.result; end if;

  select * into period_record from public.schedule_application_periods
    where id = p_period_id for update;
  if not found then raise exception 'PERIOD_NOT_FOUND'; end if;
  if period_record.updated_at <> p_expected_period_updated_at then raise exception 'STALE_PERIOD'; end if;
  if period_record.status <> 'open' or period_record.application_deadline <= now() then
    raise exception 'APPLICATION_PERIOD_CLOSED';
  end if;
  if exists (
    select 1 from unnest(normalized_dates) candidate
    where candidate < period_record.year_month
       or candidate >= (period_record.year_month + interval '1 month')::date
       or extract(isodow from candidate) not in (6, 7)
  ) then raise exception 'INVALID_APPLICATION_DATE'; end if;

  update public.schedule_applications
    set status = 'cancelled', cancelled_at = now()
    where application_period_id = p_period_id and worker_id = caller_id
      and status = 'applied' and not (work_date = any(normalized_dates));
  get diagnostics cancelled_count = row_count;
  update public.schedule_applications
    set status = 'applied', cancelled_at = null
    where application_period_id = p_period_id and worker_id = caller_id
      and status = 'cancelled' and work_date = any(normalized_dates);
  insert into public.schedule_applications (application_period_id, work_date, worker_id)
    select p_period_id, candidate, caller_id from unnest(normalized_dates) candidate
    on conflict (application_period_id, work_date, worker_id) do nothing;
  select count(*) into applied_count from public.schedule_applications
    where application_period_id = p_period_id and worker_id = caller_id and status = 'applied';

  result_value := jsonb_build_object(
    'appliedCount', applied_count, 'cancelledCount', cancelled_count,
    'selectedDates', to_jsonb(normalized_dates)
  );
  update private.schedule_application_mutation_requests
    set result = result_value, completed_at = now() where request_id = p_request_id;
  return result_value;
end;
$$;

-- Keep the public publishing signature stable, but require the period to exist.
alter function public.save_monthly_schedule_registration(uuid, date, timestamptz, timestamptz, jsonb)
  set schema private;

create function public.save_monthly_schedule_registration(
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

  -- A completed replay must reach the legacy request-log check before stale validation,
  -- because the first successful publish touches the period version.
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
  if period_record.status <> 'closed'
     and period_record.application_deadline > now() then
    raise exception 'APPLICATION_PERIOD_OPEN';
  end if;

  return private.save_monthly_schedule_registration(
    p_request_id, p_year_month, period_record.application_deadline,
    p_expected_period_updated_at, p_schedules
  );
end;
$$;

revoke all on function private.save_monthly_schedule_registration(uuid, date, timestamptz, timestamptz, jsonb)
  from public, anon, authenticated;
revoke all on function public.save_schedule_application_period(uuid, date, timestamptz, uuid, timestamptz)
  from public, anon;
revoke all on function public.set_schedule_application_period_status(uuid, uuid, public.application_period_status, timestamptz)
  from public, anon;
revoke all on function public.save_own_monthly_schedule_applications(uuid, uuid, timestamptz, date[])
  from public, anon;
revoke all on function public.save_monthly_schedule_registration(uuid, date, timestamptz, timestamptz, jsonb)
  from public, anon;
grant execute on function public.save_schedule_application_period(uuid, date, timestamptz, uuid, timestamptz)
  to authenticated;
grant execute on function public.set_schedule_application_period_status(uuid, uuid, public.application_period_status, timestamptz)
  to authenticated;
grant execute on function public.save_own_monthly_schedule_applications(uuid, uuid, timestamptz, date[])
  to authenticated;
grant execute on function public.save_monthly_schedule_registration(uuid, date, timestamptz, timestamptz, jsonb)
  to authenticated;
