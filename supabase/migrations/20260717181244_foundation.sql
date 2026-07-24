-- Lavi Crew foundation: Auth profile, scheduling, attendance, payroll and notifications.
-- Apply through the Supabase dashboard SQL editor or `supabase db push` after linking project
-- vnfoyfcjpwxlurnhabla. This migration is intentionally additive.

create extension if not exists pgcrypto;

create type public.app_role as enum ('worker', 'admin');
create type public.application_period_status as enum ('open', 'closed');
create type public.shift_status as enum ('draft', 'published', 'cancelled');
create type public.application_status as enum ('applied', 'cancelled');
create type public.assignment_status as enum ('draft', 'confirmed', 'cancelled');
create type public.attendance_status as enum ('pending', 'present', 'absent');
create type public.notice_status as enum ('published', 'deleted');
create type public.payroll_status as enum ('calculated', 'closed');
create type public.notification_type as enum ('schedule_confirmed', 'schedule_changed', 'schedule_cancelled');
create type public.notification_delivery_status as enum ('pending', 'sent', 'failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  name text not null check (char_length(trim(name)) >= 2),
  phone text not null unique check (phone ~ '^01[0-9]{8,9}$'),
  role public.app_role not null default 'worker',
  hourly_wage integer not null default 10030 check (hourly_wage > 0),
  is_active boolean not null default true,
  kakao_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index profiles_single_admin_idx on public.profiles (role) where role = 'admin';

create table public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) >= 6),
  expires_at timestamptz not null,
  max_uses integer not null check (max_uses > 0),
  used_count integer not null default 0 check (used_count between 0 and max_uses),
  is_active boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.schedule_application_periods (
  id uuid primary key default gen_random_uuid(),
  year_month date not null unique check (extract(day from year_month) = 1),
  application_deadline timestamptz not null,
  status public.application_period_status not null default 'open',
  closed_at timestamptz,
  managed_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.positions (
  id text primary key,
  name text not null unique,
  default_assignee_count smallint not null check (default_assignee_count between 1 and 2),
  check ((id, name, default_assignee_count) in (
    ('leader', '팀장', 1), ('scan', '스캔', 1), ('main', '메인', 1), ('dress', '드레스', 1),
    ('song', '축가', 1), ('manager', '매니저', 2), ('guide', '안내', 2), ('waiting-room', '대기실', 1)
  ))
);
insert into public.positions (id, name, default_assignee_count) values
 ('leader','팀장',1), ('scan','스캔',1), ('main','메인',1), ('dress','드레스',1),
 ('song','축가',1), ('manager','매니저',2), ('guide','안내',2), ('waiting-room','대기실',1)
on conflict (id) do nothing;

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  application_period_id uuid not null references public.schedule_application_periods(id) on delete restrict,
  work_date date not null unique,
  start_time time not null,
  end_time time not null check (end_time > start_time),
  ceremony_count smallint not null check (ceremony_count > 0),
  status public.shift_status not null default 'draft',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.schedule_applications (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete restrict,
  worker_id uuid not null references public.profiles(id) on delete restrict,
  status public.application_status not null default 'applied',
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shift_id, worker_id)
);

create table public.shift_assignments (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete restrict,
  worker_id uuid not null references public.profiles(id) on delete restrict,
  position_id text not null references public.positions(id) on delete restrict,
  is_training boolean not null default false,
  hourly_wage_snapshot integer not null check (hourly_wage_snapshot > 0),
  status public.assignment_status not null default 'draft',
  assigned_by uuid not null references public.profiles(id) on delete restrict,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shift_id, worker_id, position_id)
);
create unique index active_assignment_per_worker_shift_idx on public.shift_assignments (shift_id, worker_id) where status <> 'cancelled';

create table public.worker_position_skills (
  worker_id uuid not null references public.profiles(id) on delete restrict,
  position_id text not null references public.positions(id) on delete restrict,
  assigned_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (worker_id, position_id)
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null unique references public.shift_assignments(id) on delete restrict,
  status public.attendance_status not null default 'pending',
  confirmed_by uuid references public.profiles(id) on delete restrict,
  confirmed_at timestamptz,
  correction_reason text,
  corrected_by uuid references public.profiles(id) on delete restrict,
  corrected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.monthly_payrolls (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.profiles(id) on delete restrict,
  year_month date not null check (extract(day from year_month) = 1),
  total_amount integer not null default 0 check (total_amount >= 0),
  status public.payroll_status not null default 'calculated',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (worker_id, year_month)
);
create table public.payroll_items (
  id uuid primary key default gen_random_uuid(),
  payroll_id uuid not null references public.monthly_payrolls(id) on delete restrict,
  assignment_id uuid not null references public.shift_assignments(id) on delete restrict,
  attendance_record_id uuid not null unique references public.attendance_records(id) on delete restrict,
  regular_minutes integer not null check (regular_minutes >= 0),
  overtime_minutes integer not null check (overtime_minutes >= 0),
  amount integer not null check (amount >= 0),
  created_at timestamptz not null default now(),
  unique (payroll_id, assignment_id)
);

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) > 0),
  content text not null check (char_length(trim(content)) > 0),
  is_pinned boolean not null default false,
  status public.notice_status not null default 'published',
  deleted_at timestamptz,
  author_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.notice_reads (
  notice_id uuid not null references public.notices(id) on delete restrict,
  worker_id uuid not null references public.profiles(id) on delete restrict,
  read_at timestamptz not null default now(),
  primary key (notice_id, worker_id)
);
create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete restrict,
  shift_id uuid references public.shifts(id) on delete restrict,
  assignment_id uuid references public.shift_assignments(id) on delete restrict,
  type public.notification_type not null,
  channel text not null default 'kakao_alimtalk',
  delivery_status public.notification_delivery_status not null default 'pending',
  provider_message_id text,
  failure_reason text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index shifts_work_date_idx on public.shifts (work_date);
create index assignments_worker_status_idx on public.shift_assignments (worker_id, status);
create index applications_worker_status_idx on public.schedule_applications (worker_id, status);
create index notices_published_idx on public.notices (is_pinned desc, created_at desc) where status = 'published';

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and is_active);
$$;
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$ begin new.updated_at = now(); return new; end; $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger periods_touch before update on public.schedule_application_periods for each row execute function public.touch_updated_at();
create trigger shifts_touch before update on public.shifts for each row execute function public.touch_updated_at();
create trigger applications_touch before update on public.schedule_applications for each row execute function public.touch_updated_at();
create trigger assignments_touch before update on public.shift_assignments for each row execute function public.touch_updated_at();
create trigger attendance_touch before update on public.attendance_records for each row execute function public.touch_updated_at();
create trigger payroll_touch before update on public.monthly_payrolls for each row execute function public.touch_updated_at();
create trigger notices_touch before update on public.notices for each row execute function public.touch_updated_at();

-- Auth users are created by Supabase Auth; signup metadata is consumed only by this trigger.
create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, phone, kakao_consent)
  values (new.id, new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'phone', coalesce((new.raw_user_meta_data ->> 'kakao_consent')::boolean, false));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.create_profile_for_new_user();

create or replace function public.validate_invite_code(candidate_code text)
returns boolean language plpgsql security definer set search_path = public as $$
declare valid boolean;
begin
  select exists(select 1 from public.invite_codes where code = upper(trim(candidate_code)) and is_active and expires_at > now() and used_count < max_uses) into valid;
  return valid;
end; $$;

create or replace function public.claim_invite_code(candidate_code text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.invite_codes set used_count = used_count + 1
  where code = upper(trim(candidate_code)) and is_active and expires_at > now() and used_count < max_uses;
  if not found then raise exception 'INVITE_CODE_INVALID'; end if;
end; $$;

-- Atomic monthly lock: close a period once, retaining all applications.
create or replace function public.close_application_period(period_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  update public.schedule_application_periods set status = 'closed', closed_at = now()
  where id = period_id and status = 'open';
  if not found then raise exception 'PERIOD_NOT_OPEN'; end if;
end; $$;

-- Attendance + payroll is a single transaction. Nine-hour daily overtime is calculated from shift times.
create or replace function public.confirm_attendance_and_payroll(record_id uuid, next_status public.attendance_status, correction_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare a public.attendance_records; assignment public.shift_assignments; work_shift public.shifts; payroll public.monthly_payrolls; minutes int; regular int; overtime int; payment int;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  select * into a from public.attendance_records where id = record_id for update;
  if not found then raise exception 'ATTENDANCE_NOT_FOUND'; end if;
  select * into assignment from public.shift_assignments where id = a.assignment_id;
  select * into work_shift from public.shifts where id = assignment.shift_id;
  if a.confirmed_at is not null and coalesce(nullif(trim(correction_note), ''), '') = '' then raise exception 'CORRECTION_REASON_REQUIRED'; end if;
  update public.attendance_records set status = next_status, confirmed_by = auth.uid(), confirmed_at = now(), correction_reason = nullif(trim(correction_note), ''), corrected_by = case when a.confirmed_at is null then null else auth.uid() end, corrected_at = case when a.confirmed_at is null then null else now() end where id = record_id;
  if next_status = 'present' then
    minutes := extract(epoch from (work_shift.end_time - work_shift.start_time)) / 60;
    regular := least(minutes, 540); overtime := greatest(minutes - 540, 0);
    payment := round((regular * assignment.hourly_wage_snapshot + overtime * assignment.hourly_wage_snapshot * 1.5) / 60.0);
    insert into public.monthly_payrolls (worker_id, year_month, total_amount) values (assignment.worker_id, date_trunc('month', work_shift.work_date)::date, 0)
    on conflict (worker_id, year_month) do update set updated_at = now() returning * into payroll;
    insert into public.payroll_items (payroll_id, assignment_id, attendance_record_id, regular_minutes, overtime_minutes, amount) values (payroll.id, assignment.id, record_id, regular, overtime, payment)
    on conflict (attendance_record_id) do update set regular_minutes = excluded.regular_minutes, overtime_minutes = excluded.overtime_minutes, amount = excluded.amount;
    update public.monthly_payrolls p set total_amount = coalesce((select sum(amount) from public.payroll_items where payroll_id = p.id), 0) where p.id = payroll.id;
  else
    delete from public.payroll_items where attendance_record_id = record_id;
  end if;
end; $$;

alter table public.profiles enable row level security;
alter table public.invite_codes enable row level security;
alter table public.schedule_application_periods enable row level security;
alter table public.positions enable row level security;
alter table public.shifts enable row level security;
alter table public.schedule_applications enable row level security;
alter table public.shift_assignments enable row level security;
alter table public.worker_position_skills enable row level security;
alter table public.attendance_records enable row level security;
alter table public.monthly_payrolls enable row level security;
alter table public.payroll_items enable row level security;
alter table public.notices enable row level security;
alter table public.notice_reads enable row level security;
alter table public.notification_logs enable row level security;

create policy "profiles own or admin" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles self update contact only" on public.profiles for update to authenticated using (id = auth.uid() and is_active) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()) and hourly_wage = (select hourly_wage from public.profiles where id = auth.uid()));
create policy "admin manages profiles" on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "authenticated read positions" on public.positions for select to authenticated using (true);
create policy "admin manages operational tables" on public.invite_codes for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "authenticated read periods" on public.schedule_application_periods for select to authenticated using (true);
create policy "admin manages periods" on public.schedule_application_periods for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "authenticated read shifts" on public.shifts for select to authenticated using (status = 'published' or public.is_admin());
create policy "admin manages shifts" on public.shifts for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "workers own applications" on public.schedule_applications for select to authenticated using (worker_id = auth.uid() or public.is_admin());
create policy "workers apply while open" on public.schedule_applications for insert to authenticated with check (worker_id = auth.uid() and exists (select 1 from public.shifts s join public.schedule_application_periods p on p.id = s.application_period_id where s.id = shift_id and p.status = 'open' and p.application_deadline > now()));
create policy "workers cancel own while open" on public.schedule_applications for update to authenticated using (worker_id = auth.uid() and exists (select 1 from public.shifts s join public.schedule_application_periods p on p.id = s.application_period_id where s.id = shift_id and p.status = 'open' and p.application_deadline > now())) with check (worker_id = auth.uid());
create policy "admin manages applications" on public.schedule_applications for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "workers own assignments" on public.shift_assignments for select to authenticated using (worker_id = auth.uid() or public.is_admin());
create policy "admin manages assignments" on public.shift_assignments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "authenticated read skills" on public.worker_position_skills for select to authenticated using (true);
create policy "admin manages skills" on public.worker_position_skills for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "workers own attendance" on public.attendance_records for select to authenticated using (exists (select 1 from public.shift_assignments a where a.id = assignment_id and (a.worker_id = auth.uid() or public.is_admin())));
create policy "admin manages attendance" on public.attendance_records for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "workers own payroll" on public.monthly_payrolls for select to authenticated using (worker_id = auth.uid() or public.is_admin());
create policy "workers own payroll items" on public.payroll_items for select to authenticated using (exists (select 1 from public.monthly_payrolls p where p.id = payroll_id and (p.worker_id = auth.uid() or public.is_admin())));
create policy "admin manages payroll" on public.monthly_payrolls for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin manages payroll items" on public.payroll_items for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "authenticated read notices" on public.notices for select to authenticated using (status = 'published' or public.is_admin());
create policy "admin manages notices" on public.notices for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "workers own notice reads" on public.notice_reads for select to authenticated using (worker_id = auth.uid() or public.is_admin());
create policy "workers create own notice reads" on public.notice_reads for insert to authenticated with check (worker_id = auth.uid());
create policy "admin reads notifications" on public.notification_logs for select to authenticated using (public.is_admin());
create policy "workers own notifications" on public.notification_logs for select to authenticated using (recipient_id = auth.uid());
create policy "admin manages notifications" on public.notification_logs for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Security hardening and correction history. These definitions intentionally supersede
-- the foundation definitions above before the migration is first applied.
alter table public.payroll_items add column voided_at timestamptz;
alter table public.payroll_items add column voided_by uuid references public.profiles(id) on delete restrict;
alter table public.payroll_items add column void_reason text;
alter table public.payroll_items drop constraint payroll_items_attendance_record_id_key;
create unique index payroll_items_one_active_revision_idx on public.payroll_items (attendance_record_id) where voided_at is null;

create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare claimed_invite uuid;
begin
  -- OAuth users have no personnel information or invitation yet. They must finish onboarding.
  if coalesce(new.raw_user_meta_data ->> 'invite_code', '') = '' then return new; end if;
  update public.invite_codes set used_count = used_count + 1
  where id = (
    select id from public.invite_codes
    where code = upper(trim(new.raw_user_meta_data ->> 'invite_code')) and is_active and expires_at > now() and used_count < max_uses
    for update skip locked limit 1
  ) returning id into claimed_invite;
  if claimed_invite is null then raise exception 'INVITE_CODE_INVALID'; end if;
  insert into public.profiles (id, name, phone, kakao_consent)
  values (new.id, new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'phone', coalesce((new.raw_user_meta_data ->> 'kakao_consent')::boolean, false));
  return new;
end; $$;

create or replace function public.complete_worker_onboarding(candidate_name text, candidate_phone text, candidate_invite_code text, consent boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare claimed_invite uuid;
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  if exists (select 1 from public.profiles where id = auth.uid()) then raise exception 'PROFILE_ALREADY_EXISTS'; end if;
  if char_length(trim(candidate_name)) < 2 or candidate_phone !~ '^01[0-9]{8,9}$' then raise exception 'INVALID_PROFILE'; end if;
  update public.invite_codes set used_count = used_count + 1
  where id = (select id from public.invite_codes where code = upper(trim(candidate_invite_code)) and is_active and expires_at > now() and used_count < max_uses for update skip locked limit 1)
  returning id into claimed_invite;
  if claimed_invite is null then raise exception 'INVITE_CODE_INVALID'; end if;
  insert into public.profiles (id, name, phone, kakao_consent) values (auth.uid(), trim(candidate_name), candidate_phone, consent);
end; $$;

create or replace function public.create_pending_attendance_record()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.attendance_records (assignment_id) values (new.id) on conflict (assignment_id) do nothing;
  return new;
end; $$;
create trigger assignment_creates_attendance after insert on public.shift_assignments for each row execute function public.create_pending_attendance_record();

create or replace function public.confirm_attendance_and_payroll(record_id uuid, next_status public.attendance_status, correction_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare a public.attendance_records; assignment public.shift_assignments; work_shift public.shifts; payroll public.monthly_payrolls; minutes int; regular int; overtime int; payment int;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  select * into a from public.attendance_records where id = record_id for update;
  if not found then raise exception 'ATTENDANCE_NOT_FOUND'; end if;
  if a.confirmed_at is not null and coalesce(nullif(trim(correction_note), ''), '') is null then raise exception 'CORRECTION_REASON_REQUIRED'; end if;
  select * into assignment from public.shift_assignments where id = a.assignment_id;
  select * into work_shift from public.shifts where id = assignment.shift_id;
  update public.attendance_records set status = next_status, confirmed_by = auth.uid(), confirmed_at = now(), correction_reason = nullif(trim(correction_note), ''), corrected_by = case when a.confirmed_at is null then null else auth.uid() end, corrected_at = case when a.confirmed_at is null then null else now() end where id = record_id;
  update public.payroll_items set voided_at = now(), voided_by = auth.uid(), void_reason = coalesce(nullif(trim(correction_note), ''), 'attendance corrected') where attendance_record_id = record_id and voided_at is null;
  if next_status = 'present' then
    minutes := extract(epoch from (work_shift.end_time - work_shift.start_time)) / 60; regular := least(minutes, 540); overtime := greatest(minutes - 540, 0); payment := round((regular * assignment.hourly_wage_snapshot + overtime * assignment.hourly_wage_snapshot * 1.5) / 60.0);
    insert into public.monthly_payrolls (worker_id, year_month, total_amount) values (assignment.worker_id, date_trunc('month', work_shift.work_date)::date, 0) on conflict (worker_id, year_month) do update set updated_at = now() returning * into payroll;
    insert into public.payroll_items (payroll_id, assignment_id, attendance_record_id, regular_minutes, overtime_minutes, amount) values (payroll.id, assignment.id, record_id, regular, overtime, payment);
  end if;
  update public.monthly_payrolls p set total_amount = coalesce((select sum(amount) from public.payroll_items where payroll_id = p.id and voided_at is null), 0) where p.worker_id = assignment.worker_id and p.year_month = date_trunc('month', work_shift.work_date)::date;
end; $$;

drop policy "profiles self update contact only" on public.profiles;
-- Profile edits are server-controller operations; no browser role, wage, active-state or contact mutation is granted.
revoke all on all tables in schema public from anon, authenticated;
grant select on public.profiles, public.invite_codes, public.schedule_application_periods, public.positions, public.shifts, public.schedule_applications, public.shift_assignments, public.worker_position_skills, public.attendance_records, public.monthly_payrolls, public.payroll_items, public.notices, public.notice_reads, public.notification_logs to authenticated;
grant insert, update on public.schedule_applications, public.notice_reads to authenticated;
grant insert, update, delete on public.invite_codes, public.schedule_application_periods, public.shifts, public.shift_assignments, public.worker_position_skills, public.attendance_records, public.monthly_payrolls, public.payroll_items, public.notices, public.notification_logs to authenticated;
revoke all on function public.is_admin(), public.touch_updated_at(), public.create_profile_for_new_user(), public.validate_invite_code(text), public.claim_invite_code(text), public.create_pending_attendance_record() from public;
revoke all on function public.close_application_period(uuid), public.confirm_attendance_and_payroll(uuid, public.attendance_status, text), public.complete_worker_onboarding(text, text, text, boolean) from public;
grant execute on function public.close_application_period(uuid), public.confirm_attendance_and_payroll(uuid, public.attendance_status, text), public.complete_worker_onboarding(text, text, text, boolean) to authenticated;
grant execute on function public.is_admin() to authenticated;
