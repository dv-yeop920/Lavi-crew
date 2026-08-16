-- Persist the administrator-selected work dates for each monthly application period.
-- These rows are the single source of truth for both worker applications and admin registration.

create table if not exists public.schedule_application_dates (
  application_period_id uuid not null
    references public.schedule_application_periods(id) on delete cascade,
  work_date date not null,
  created_at timestamptz not null default now(),
  primary key (application_period_id, work_date)
);

alter table public.schedule_application_dates enable row level security;
revoke all on public.schedule_application_dates from public, anon, authenticated;
grant select on public.schedule_application_dates to authenticated;

create policy "active users read application dates"
on public.schedule_application_dates for select
to authenticated
using ((select private.is_active_user()));

-- Recover periods opened before application dates were persisted. The historic UI did not
-- store its selected dates, so existing applicant dates are the only reliable source.
insert into public.schedule_application_dates (application_period_id, work_date)
select distinct application_period_id, work_date
from public.schedule_applications
on conflict (application_period_id, work_date) do nothing;

create or replace function private.seed_demo_worker_applications(
  p_application_period_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.schedule_applications (
    application_period_id,
    worker_id,
    work_date,
    status,
    cancelled_at
  )
  select
    p_application_period_id,
    profile.id,
    application_date.work_date,
    'applied'::public.application_status,
    null
  from private.demo_schedule_workers demo
  join public.profiles profile on profile.id = demo.worker_id
  join public.schedule_application_dates application_date
    on application_date.application_period_id = p_application_period_id
  where profile.role = 'worker'
    and profile.is_active
  on conflict (application_period_id, work_date, worker_id) do update
    set status = 'applied'::public.application_status,
        cancelled_at = null,
        updated_at = now();
end;
$$;

revoke all on function private.seed_demo_worker_applications(uuid)
  from public, anon, authenticated;

create or replace function private.seed_demo_worker_applications_when_reopened()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'open' and old.status is distinct from 'open'
     and new.application_deadline > now() then
    perform private.seed_demo_worker_applications(new.id);
  end if;
  return new;
end;
$$;

revoke all on function private.seed_demo_worker_applications_when_reopened()
  from public, anon, authenticated;

drop trigger if exists seed_demo_worker_applications_for_open_period
  on public.schedule_application_periods;

create trigger seed_demo_worker_applications_when_reopened
after update of status on public.schedule_application_periods
for each row
execute function private.seed_demo_worker_applications_when_reopened();

create or replace function public.save_schedule_application_period_with_dates(
  p_request_id uuid,
  p_year_month date,
  p_application_deadline timestamptz,
  p_period_id uuid,
  p_expected_updated_at timestamptz,
  p_application_dates date[]
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
  normalized_dates date[];
  stored_dates date[];
  payload_hash_value text;
  result_value jsonb;
begin
  if caller_id is null or not private.is_active_user(caller_id) or not private.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if p_request_id is null or p_year_month is null or extract(day from p_year_month) <> 1
     or p_application_deadline is null or p_application_deadline <= now()
     or p_application_dates is null
     or (p_period_id is null) <> (p_expected_updated_at is null) then
    raise exception 'INVALID_INPUT';
  end if;

  select coalesce(array_agg(distinct candidate order by candidate), '{}'::date[])
    into normalized_dates
    from unnest(p_application_dates) candidate;
  if cardinality(normalized_dates) = 0
     or exists (
       select 1
       from unnest(normalized_dates) candidate
       where candidate < p_year_month
          or candidate >= (p_year_month + interval '1 month')::date
          or extract(isodow from candidate) not in (6, 7)
     ) then
    raise exception 'INVALID_APPLICATION_DATE';
  end if;

  payload_hash_value := encode(extensions.digest(convert_to(jsonb_build_object(
    'year_month', p_year_month,
    'deadline', p_application_deadline,
    'period_id', p_period_id,
    'expected', p_expected_updated_at,
    'application_dates', to_jsonb(normalized_dates)
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

    insert into public.schedule_application_dates (application_period_id, work_date)
    select period_record.id, candidate
    from unnest(normalized_dates) candidate;
    perform private.seed_demo_worker_applications(period_record.id);
  else
    select * into period_record from public.schedule_application_periods
      where id = p_period_id and year_month = p_year_month for update;
    if not found then raise exception 'PERIOD_NOT_FOUND'; end if;
    if period_record.updated_at <> p_expected_updated_at then raise exception 'STALE_PERIOD'; end if;

    select coalesce(array_agg(work_date order by work_date), '{}'::date[])
      into stored_dates
      from public.schedule_application_dates
      where application_period_id = period_record.id;
    if stored_dates is distinct from normalized_dates then
      raise exception 'APPLICATION_DATES_LOCKED';
    end if;

    update public.schedule_application_periods
      set application_deadline = p_application_deadline, managed_by = caller_id
      where id = period_record.id returning * into period_record;
  end if;

  result_value := jsonb_build_object(
    'periodId', period_record.id,
    'status', period_record.status,
    'applicationDeadline', period_record.application_deadline,
    'applicationDates', to_jsonb(normalized_dates),
    'updatedAt', period_record.updated_at
  );
  update private.schedule_application_mutation_requests
    set result = result_value, completed_at = now() where request_id = p_request_id;
  return result_value;
end;
$$;

revoke all on function public.save_schedule_application_period_with_dates(
  uuid, date, timestamptz, uuid, timestamptz, date[]
) from public, anon;
grant execute on function public.save_schedule_application_period_with_dates(
  uuid, date, timestamptz, uuid, timestamptz, date[]
) to authenticated;

-- Never allow a worker to apply for a date the manager did not open.
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
       or not exists (
         select 1 from public.schedule_application_dates application_date
         where application_date.application_period_id = p_period_id
           and application_date.work_date = candidate
       )
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

-- The final persistence boundary: only dates opened for the period may become shifts.
create or replace function private.enforce_shift_application_date()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.schedule_application_dates application_date
    where application_date.application_period_id = new.application_period_id
      and application_date.work_date = new.work_date
  ) then
    raise exception 'APPLICATION_DATE_NOT_OPEN';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_shift_application_date()
  from public, anon, authenticated;

drop trigger if exists enforce_shift_application_date on public.shifts;
create trigger enforce_shift_application_date
before insert on public.shifts
for each row execute function private.enforce_shift_application_date();
