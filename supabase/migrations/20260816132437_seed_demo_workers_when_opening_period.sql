create table if not exists private.demo_schedule_workers (
  worker_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table private.demo_schedule_workers enable row level security;
revoke all on table private.demo_schedule_workers from public, anon, authenticated;

insert into private.demo_schedule_workers (worker_id)
select id
from public.profiles
where role = 'worker'
  and is_active
  and name = any(array[
    '안유정', '박지희', '윤태관', '문태희', '이시온', '김지윤',
    '강예서', '김윤아', '박주은', '신서하', '안효상', '이효린'
  ])
on conflict (worker_id) do nothing;

create or replace function private.seed_demo_worker_applications_for_open_period()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'open' or new.application_deadline <= now() then
    return new;
  end if;

  insert into public.schedule_applications (
    application_period_id,
    worker_id,
    work_date,
    status,
    cancelled_at
  )
  select
    new.id,
    profile.id,
    work_date.day::date,
    'applied'::public.application_status,
    null
  from private.demo_schedule_workers demo
  join public.profiles profile on profile.id = demo.worker_id
  cross join lateral generate_series(
    new.year_month,
    (new.year_month + interval '1 month - 1 day')::date,
    interval '1 day'
  ) as work_date(day)
  where profile.role = 'worker'
    and profile.is_active
    and extract(isodow from work_date.day) in (6, 7)
  on conflict (application_period_id, work_date, worker_id) do update
    set status = 'applied'::public.application_status,
        cancelled_at = null,
        updated_at = now();

  return new;
end;
$$;

revoke all on function private.seed_demo_worker_applications_for_open_period()
  from public, anon, authenticated;

drop trigger if exists seed_demo_worker_applications_for_open_period
  on public.schedule_application_periods;

create trigger seed_demo_worker_applications_for_open_period
after insert or update of status, application_deadline
on public.schedule_application_periods
for each row
when (new.status = 'open')
execute function private.seed_demo_worker_applications_for_open_period();
