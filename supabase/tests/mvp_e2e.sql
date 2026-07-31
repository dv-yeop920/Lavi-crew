-- Repeatable remote/local MVP verification. The entire fixture is rolled back.
begin;

create temp table e2e_context as
select
  (select id from public.profiles where role = 'admin' and is_active limit 1) admin_id,
  (select id from public.profiles where role = 'worker' and is_active limit 1) worker_id;

do $$
begin
  if exists (select 1 from e2e_context where admin_id is null or worker_id is null) then
    raise exception 'E2E_REQUIRES_ACTIVE_ADMIN_AND_WORKER';
  end if;
end;
$$;

create temp table e2e_workers (rn integer primary key, id uuid not null unique);
insert into e2e_workers
select n, gen_random_uuid() from generate_series(1, 10) n;
insert into auth.users (id) select id from e2e_workers;
insert into public.profiles (id, name, phone, hourly_wage, is_active, kakao_consent)
select id, 'E2E검증근로자' || rn, '019' || lpad(rn::text, 8, '0'), 10000, true, rn = 1
from e2e_workers;

create temp table e2e_results (key text primary key, value jsonb not null);
grant select on e2e_context, e2e_workers to anon, authenticated;
grant select, insert, update on e2e_results to anon, authenticated;

insert into public.invite_codes (code, label, expires_at, max_uses, created_by)
select 'E2E-VALID-CODE', 'E2E 가입 검증', now() + interval '1 day', 2, admin_id
from e2e_context;

set local role anon;
insert into e2e_results
select 'signup_identity', to_jsonb(check_result)
from public.check_signup_identity(
  'E2E가입가능이름', '01812345678', 'E2E-VALID-CODE'
) check_result;
reset role;

create temp table e2e_assignments as
with slots as (
  select
    position.id as position_id,
    slot_index,
    row_number() over (order by position.id, slot_index) as sequence_no
  from public.positions position
  cross join lateral generate_series(0, position.default_assignee_count - 1) slot_index
)
select
  slots.sequence_no,
  jsonb_build_object(
    'workerId', worker.id,
    'positionId', slots.position_id,
    'slotIndex', slots.slot_index,
    'slotKind', 'base',
    'isTraining', false
  ) as payload
from slots
join e2e_workers worker on worker.rn = slots.sequence_no;

create temp table e2e_payloads as
with weekend_dates as (
  select day::date work_date
  from generate_series(date '2099-01-01', date '2099-01-31', interval '1 day') day
  where extract(isodow from day) in (6, 7)
  order by day
  limit 2
), payloads as (
  select
    jsonb_agg(payload order by sequence_no) assignments,
    jsonb_agg(
      case when sequence_no = 1
        then payload || jsonb_build_object('isTraining', true)
        else payload
      end
      order by sequence_no
    ) updated_assignments
  from e2e_assignments
)
select
  (select array_agg(work_date order by work_date) from weekend_dates) selected_dates,
  payloads.assignments,
  payloads.updated_assignments,
  (
    select jsonb_agg(jsonb_build_object(
      'workDate', work_date,
      'ceremonyCount', 3,
      'startTime', '08:00',
      'endTime', '17:00',
      'assignments', payloads.assignments
    ) order by work_date)
    from weekend_dates
  ) schedules
from payloads;
grant select on e2e_assignments, e2e_payloads to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', (select admin_id::text from e2e_context), true);
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', (select admin_id from e2e_context), 'role', 'authenticated'
)::text, true);
insert into e2e_results
select 'period_created', public.save_schedule_application_period(
  '40000000-0000-4000-8000-000000000001', date '2099-01-01',
  timestamptz '2098-12-15 23:59:59+09', null, null
);

select set_config('request.jwt.claim.sub', (select worker_id::text from e2e_context), true);
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', (select worker_id from e2e_context), 'role', 'authenticated'
)::text, true);
insert into e2e_results
select 'applications_first', public.save_own_monthly_schedule_applications(
  '40000000-0000-4000-8000-000000000002',
  (select (value ->> 'periodId')::uuid from e2e_results where key = 'period_created'),
  (select (value ->> 'updatedAt')::timestamptz from e2e_results where key = 'period_created'),
  (select selected_dates from e2e_payloads)
);
insert into e2e_results
select 'applications_replay', public.save_own_monthly_schedule_applications(
  '40000000-0000-4000-8000-000000000002',
  (select (value ->> 'periodId')::uuid from e2e_results where key = 'period_created'),
  (select (value ->> 'updatedAt')::timestamptz from e2e_results where key = 'period_created'),
  (select selected_dates from e2e_payloads)
);

select set_config('request.jwt.claim.sub', (select admin_id::text from e2e_context), true);
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', (select admin_id from e2e_context), 'role', 'authenticated'
)::text, true);
insert into e2e_results
select 'period_closed', public.set_schedule_application_period_status(
  '40000000-0000-4000-8000-000000000003',
  (select (value ->> 'periodId')::uuid from e2e_results where key = 'period_created'),
  'closed',
  (select (value ->> 'updatedAt')::timestamptz from e2e_results where key = 'period_created')
);
insert into e2e_results
select 'publish_first', public.save_monthly_schedule_registration(
  '40000000-0000-4000-8000-000000000004', date '2099-01-01',
  timestamptz '2098-12-15 23:59:59+09',
  (select (value ->> 'updatedAt')::timestamptz from e2e_results where key = 'period_closed'),
  (select schedules from e2e_payloads)
);
insert into e2e_results
select 'publish_replay', public.save_monthly_schedule_registration(
  '40000000-0000-4000-8000-000000000004', date '2099-01-01',
  timestamptz '2098-12-15 23:59:59+09',
  (select (value ->> 'updatedAt')::timestamptz from e2e_results where key = 'period_closed'),
  (select schedules from e2e_payloads)
);
reset role;

create temp table e2e_shift_targets as
select row_number() over (order by work_date) rn, id, updated_at
from public.shifts
where application_period_id =
  (select (value ->> 'periodId')::uuid from e2e_results where key = 'period_created');
grant select on e2e_shift_targets to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', (select admin_id::text from e2e_context), true);
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', (select admin_id from e2e_context), 'role', 'authenticated'
)::text, true);
insert into e2e_results
select 'daily_updated', public.update_daily_schedule(
  '40000000-0000-4000-8000-000000000005',
  (select id from e2e_shift_targets where rn = 1),
  (select updated_at from e2e_shift_targets where rn = 1),
  4::smallint, time '08:00', time '18:00',
  (select updated_assignments from e2e_payloads)
);
insert into e2e_results
select 'daily_cancelled', public.cancel_daily_schedule(
  '40000000-0000-4000-8000-000000000006',
  (select id from e2e_shift_targets where rn = 2),
  (select updated_at from e2e_shift_targets where rn = 2),
  'E2E 일정 취소 검증'
);
reset role;

-- Negative RLS control: this published shift has no assignment for worker rn=1.
insert into public.shifts (
  application_period_id, work_date, start_time, end_time,
  ceremony_count, status, created_by
)
select
  (value ->> 'periodId')::uuid, date '2099-01-17', time '09:00', time '17:00',
  1, 'published', (select admin_id from e2e_context)
from e2e_results
where key = 'period_created';

insert into public.schedule_application_periods (
  year_month, application_deadline, status, closed_at, managed_by
)
select date '2001-01-01', timestamptz '2000-12-31 23:59:59+09',
  'closed', now(), admin_id
from e2e_context;
insert into public.shifts (
  application_period_id, work_date, start_time, end_time,
  ceremony_count, status, created_by
)
select id, date '2001-01-06', time '08:00', time '18:00', 3, 'published', managed_by
from public.schedule_application_periods where year_month = date '2001-01-01';
insert into public.shift_assignments (
  shift_id, worker_id, position_id, slot_index, is_training,
  hourly_wage_snapshot, status, assigned_by, confirmed_at
)
select shift.id, worker.id, 'leader', 0, false, 10000, 'confirmed', context.admin_id, now()
from public.shifts shift
cross join (select id from e2e_workers where rn = 1) worker
cross join e2e_context context
where shift.work_date = date '2001-01-06';

set local role authenticated;
select set_config('request.jwt.claim.sub', (select admin_id::text from e2e_context), true);
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', (select admin_id from e2e_context), 'role', 'authenticated'
)::text, true);
insert into e2e_results
select 'attendance_first', public.confirm_attendance_and_payroll(
  '40000000-0000-4000-8000-000000000007', attendance.id, attendance.updated_at,
  'present', timestamptz '2001-01-06 08:00:00+09',
  timestamptz '2001-01-06 18:00:00+09', null
)
from public.attendance_records attendance
join public.shift_assignments assignment on assignment.id = attendance.assignment_id
join public.shifts shift on shift.id = assignment.shift_id
where shift.work_date = date '2001-01-06';
insert into e2e_results
select 'attendance_corrected', public.confirm_attendance_and_payroll(
  '40000000-0000-4000-8000-000000000008', attendance.id, attendance.updated_at,
  'present', timestamptz '2001-01-06 08:00:00+09',
  timestamptz '2001-01-06 17:30:00+09', '퇴근 시각 정정'
)
from public.attendance_records attendance
join public.shift_assignments assignment on assignment.id = attendance.assignment_id
join public.shifts shift on shift.id = assignment.shift_id
where shift.work_date = date '2001-01-06';

insert into e2e_results
select 'notice_created', public.create_notice(
  '40000000-0000-4000-8000-000000000009', 'E2E 공지', '실제 공지 흐름 검증', true
);
select set_config('request.jwt.claim.sub', (select worker_id::text from e2e_context), true);
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', (select worker_id from e2e_context), 'role', 'authenticated'
)::text, true);
insert into e2e_results
select 'notice_read', public.mark_notice_read(
  '40000000-0000-4000-8000-000000000010',
  (select (value ->> 'noticeId')::uuid from e2e_results where key = 'notice_created')
);

select set_config('request.jwt.claim.sub', (select admin_id::text from e2e_context), true);
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', (select admin_id from e2e_context), 'role', 'authenticated'
)::text, true);
insert into e2e_results
select 'notice_updated', public.update_notice(
  '40000000-0000-4000-8000-000000000011',
  (select (value ->> 'noticeId')::uuid from e2e_results where key = 'notice_created'),
  (select (value ->> 'updatedAt')::timestamptz from e2e_results where key = 'notice_created'),
  'E2E 공지 수정', '실제 공지 수정 검증', false
);
insert into e2e_results
select 'notice_deleted', public.delete_notice(
  '40000000-0000-4000-8000-000000000012',
  (select (value ->> 'noticeId')::uuid from e2e_results where key = 'notice_updated'),
  (select (value ->> 'updatedAt')::timestamptz from e2e_results where key = 'notice_updated')
);

insert into e2e_results
select 'invite_created', public.create_invite_code(
  '40000000-0000-4000-8000-000000000013', 'LAVI-123456ABCDEF',
  'E2E 초대 RPC', timestamptz '2098-12-01 23:59:59+09', 2
);
insert into e2e_results
select 'invite_replay', public.create_invite_code(
  '40000000-0000-4000-8000-000000000013', 'LAVI-123456ABCDEF',
  'E2E 초대 RPC', timestamptz '2098-12-01 23:59:59+09', 2
);
insert into e2e_results
select 'invite_deactivated', public.deactivate_invite_code(
  '40000000-0000-4000-8000-000000000014',
  (select (value ->> 'inviteId')::uuid from e2e_results where key = 'invite_created')
);

select set_config('request.jwt.claim.sub', (select id::text from e2e_workers where rn = 1), true);
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', (select id from e2e_workers where rn = 1), 'role', 'authenticated'
)::text, true);
insert into e2e_results
select 'worker_rls', jsonb_build_object(
  'visibleFutureShiftCount', count(*)
)
from public.shifts
where application_period_id =
  (select (value ->> 'periodId')::uuid from e2e_results where key = 'period_created');
reset role;

insert into e2e_results
select 'assertions', jsonb_build_object(
  'signupAccepted', (select (value ->> 'is_name_available')::boolean
    and (value ->> 'is_phone_available')::boolean
    and (value ->> 'is_invite_code_valid')::boolean
    from e2e_results where key = 'signup_identity'),
  'applicationReplayMatches',
    (select value from e2e_results where key = 'applications_first') =
    (select value from e2e_results where key = 'applications_replay'),
  'publishReplayMatches',
    (select value from e2e_results where key = 'publish_first') =
    (select value from e2e_results where key = 'publish_replay'),
  'publishedShiftCount', (select count(*) from public.shifts where application_period_id =
    (select (value ->> 'periodId')::uuid from e2e_results where key = 'period_created')
    and status = 'published'),
  'cancelledShiftCount', (select count(*) from public.shifts where application_period_id =
    (select (value ->> 'periodId')::uuid from e2e_results where key = 'period_created')
    and status = 'cancelled'),
  'assignmentRevisionPreserved', (select count(*) >= 2 from public.shift_assignments
    where shift_id = (select id from e2e_shift_targets where rn = 1)
      and worker_id = (select id from e2e_workers where rn = 1)),
  'scheduleChangedNotificationCount', (select count(*) from public.notification_logs
    where shift_id = (select id from e2e_shift_targets where rn = 1)
      and recipient_id = (select id from e2e_workers where rn = 1)
      and type = 'schedule_changed'
      and delivery_status = 'pending'),
  'activePayrollAmount', (select amount from public.payroll_items item
    join public.shift_assignments assignment on assignment.id = item.assignment_id
    join public.shifts shift on shift.id = assignment.shift_id
    where shift.work_date = date '2001-01-06' and item.voided_at is null),
  'voidedPayrollRevisionCount', (select count(*) from public.payroll_items item
    join public.shift_assignments assignment on assignment.id = item.assignment_id
    join public.shifts shift on shift.id = assignment.shift_id
    where shift.work_date = date '2001-01-06' and item.voided_at is not null),
  'noticeDeleted', (select status = 'deleted' from public.notices where id =
    (select (value ->> 'noticeId')::uuid from e2e_results where key = 'notice_created')),
  'noticeReadCount', (select count(*) from public.notice_reads where notice_id =
    (select (value ->> 'noticeId')::uuid from e2e_results where key = 'notice_created')),
  'inviteReplayMatches',
    (select value from e2e_results where key = 'invite_created') =
    (select value from e2e_results where key = 'invite_replay'),
  'workerOwnShiftCount', (select (value ->> 'visibleFutureShiftCount')::integer
    from e2e_results where key = 'worker_rls')
);

do $$
declare evidence jsonb;
begin
  select value into evidence from e2e_results where key = 'assertions';
  if evidence ->> 'signupAccepted' is distinct from 'true'
     or evidence ->> 'applicationReplayMatches' is distinct from 'true'
     or evidence ->> 'publishReplayMatches' is distinct from 'true'
     or (evidence ->> 'publishedShiftCount')::integer is distinct from 2
     or (evidence ->> 'cancelledShiftCount')::integer is distinct from 1
     or evidence ->> 'assignmentRevisionPreserved' is distinct from 'true'
     or (evidence ->> 'scheduleChangedNotificationCount')::integer is distinct from 1
     or (evidence ->> 'activePayrollAmount')::integer is distinct from 97500
     or (evidence ->> 'voidedPayrollRevisionCount')::integer is distinct from 1
     or evidence ->> 'noticeDeleted' is distinct from 'true'
     or (evidence ->> 'noticeReadCount')::integer is distinct from 1
     or evidence ->> 'inviteReplayMatches' is distinct from 'true'
     or (evidence ->> 'workerOwnShiftCount')::integer is distinct from 1 then
    raise exception 'MVP_E2E_ASSERTION_FAILED: %', evidence;
  end if;
end;
$$;

select value as mvp_e2e_evidence from e2e_results where key = 'assertions';
rollback;
