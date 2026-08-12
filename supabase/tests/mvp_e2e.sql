-- Repeatable clean-local MVP verification. The entire fixture is rolled back.
begin;

-- Reuse real active identities when this runs against a linked project, but create
-- transaction-scoped fixtures when a freshly reset local database has no members.
create temp table e2e_context as
select
  coalesce(
    (select id from public.profiles where role = 'admin' and is_active limit 1),
    gen_random_uuid()
  ) admin_id,
  coalesce(
    (select id from public.profiles where role = 'worker' and is_active limit 1),
    gen_random_uuid()
  ) worker_id;

insert into auth.users (id)
select identity_id
from (
  select admin_id identity_id from e2e_context
  union all
  select worker_id from e2e_context
) identities
where not exists (select 1 from auth.users where id = identity_id);

insert into public.profiles (id, name, phone, role, hourly_wage, is_active, hired_at)
select admin_id, 'E2E검증관리자', '01790000001', 'admin', 10000, true, current_date
from e2e_context
where not exists (select 1 from public.profiles where id = admin_id);

insert into public.profiles (id, name, phone, role, hourly_wage, is_active, hired_at)
select worker_id, 'E2E검증신청자', '01790000002', 'worker', 10000, true, current_date
from e2e_context
where not exists (select 1 from public.profiles where id = worker_id);

create temp table e2e_workers (rn integer primary key, id uuid not null unique);
insert into e2e_workers
select n, gen_random_uuid() from generate_series(1, 11) n;
insert into auth.users (id) select id from e2e_workers;
insert into public.profiles (id, name, phone, hourly_wage, is_active, kakao_consent, hired_at)
select id, 'E2E검증근로자' || rn, '019' || lpad(rn::text, 8, '0'), 10000, true, rn = 1, current_date
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
), payload_variants as (
  select
    payloads.*,
    jsonb_set(
      payloads.assignments,
      '{0,workerId}',
      to_jsonb((select id::text from e2e_workers where rn = 11))
    ) non_applicant_assignments
  from payloads
)
select
  (select array_agg(work_date order by work_date) from weekend_dates) selected_dates,
  payloads.assignments,
  payloads.updated_assignments,
  payloads.non_applicant_assignments,
  (
    select jsonb_agg(jsonb_build_object(
      'workDate', work_date,
      'ceremonyCount', 3,
      'startTime', '08:00',
      'endTime', '17:00',
      'assignments', payloads.assignments
    ) order by work_date)
    from weekend_dates
  ) schedules,
  (
    select jsonb_agg(jsonb_build_object(
      'workDate', work_date,
      'ceremonyCount', 3,
      'startTime', '08:00',
      'endTime', '17:00',
      'assignments', payloads.non_applicant_assignments
    ) order by work_date)
    from weekend_dates
  ) non_applicant_schedules
from payload_variants payloads;
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

reset role;
insert into public.schedule_applications (application_period_id, work_date, worker_id, status)
select
  (select (value ->> 'periodId')::uuid from e2e_results where key = 'period_created'),
  selected_date,
  worker.id,
  'applied'
from e2e_workers worker
cross join lateral unnest((select selected_dates from e2e_payloads)) selected_date
where worker.rn between 1 and 10;
set local role authenticated;
select set_config('request.jwt.claim.sub', (select worker_id::text from e2e_context), true);
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', (select worker_id from e2e_context), 'role', 'authenticated'
)::text, true);

do $$
begin
  begin
    perform public.save_own_monthly_schedule_applications(
      '40000000-0000-4000-8000-000000000002',
      (select (value ->> 'periodId')::uuid from e2e_results where key = 'period_created'),
      (select (value ->> 'updatedAt')::timestamptz from e2e_results where key = 'period_created'),
      (select selected_dates[1:1] from e2e_payloads)
    );
    raise exception 'EXPECTED_IDEMPOTENCY_KEY_REUSED';
  exception
    when others then
      if sqlerrm = 'IDEMPOTENCY_KEY_REUSED' then
        insert into e2e_results values ('application_idempotency_conflict', 'true'::jsonb);
      elsif sqlerrm = 'EXPECTED_IDEMPOTENCY_KEY_REUSED' then
        raise exception 'APPLICATION_IDEMPOTENCY_CONFLICT_NOT_REJECTED';
      else
        raise;
      end if;
  end;
end;
$$;

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

do $$
begin
  begin
    perform public.save_monthly_schedule_registration(
      '40000000-0000-4000-8000-000000000017', date '2099-01-01',
      timestamptz '2098-12-15 23:59:59+09',
      (select (value ->> 'updatedAt')::timestamptz from e2e_results where key = 'period_closed'),
      (select non_applicant_schedules from e2e_payloads)
    );
    raise exception 'EXPECTED_WORKER_NOT_APPLIED';
  exception
    when others then
      if sqlerrm = 'WORKER_NOT_APPLIED' then
        insert into e2e_results values ('monthly_non_applicant_rejected', 'true'::jsonb);
      elsif sqlerrm = 'EXPECTED_WORKER_NOT_APPLIED' then
        raise exception 'MONTHLY_NON_APPLICANT_NOT_REJECTED';
      else
        raise;
      end if;
  end;
end;
$$;
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

-- A previously confirmed worker remains valid even if the application is no longer applied.
update public.schedule_applications
set status = 'cancelled', cancelled_at = now()
where work_date = (select selected_dates[1] from e2e_payloads)
  and worker_id = (select id from e2e_workers where rn = 1);

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

do $$
begin
  begin
    perform public.update_daily_schedule(
      '40000000-0000-4000-8000-000000000018',
      (select id from e2e_shift_targets where rn = 1),
      (select (value ->> 'shiftUpdatedAt')::timestamptz
         from e2e_results where key = 'daily_updated'),
      4::smallint, time '08:00', time '18:00',
      (select non_applicant_assignments from e2e_payloads)
    );
    raise exception 'EXPECTED_WORKER_NOT_APPLIED';
  exception
    when others then
      if sqlerrm = 'WORKER_NOT_APPLIED' then
        insert into e2e_results values ('daily_non_applicant_rejected', 'true'::jsonb);
      elsif sqlerrm = 'EXPECTED_WORKER_NOT_APPLIED' then
        raise exception 'DAILY_NON_APPLICANT_NOT_REJECTED';
      else
        raise;
      end if;
  end;
end;
$$;

do $$
begin
  begin
    perform public.update_daily_schedule(
      '40000000-0000-4000-8000-000000000015',
      (select id from e2e_shift_targets where rn = 1),
      timestamptz '1900-01-01 00:00:00+00',
      9::smallint, time '07:00', time '19:00',
      (select updated_assignments from e2e_payloads)
    );
    raise exception 'EXPECTED_STALE_SHIFT';
  exception
    when others then
      if sqlerrm = 'STALE_SHIFT' then
        insert into e2e_results values ('stale_shift_rejected', 'true'::jsonb);
      elsif sqlerrm = 'EXPECTED_STALE_SHIFT' then
        raise exception 'STALE_SHIFT_NOT_REJECTED';
      else
        raise;
      end if;
  end;
end;
$$;

reset role;
insert into e2e_results
select 'failed_daily_update_rollback', jsonb_build_object(
  'requestCount', (
    select count(*) from private.daily_schedule_mutation_requests
    where request_id = '40000000-0000-4000-8000-000000000015'
  ),
  'shiftUnchanged', ceremony_count = 4
    and start_time = time '08:00'
    and end_time = time '18:00'
    and status = 'published'
)
from public.shifts
where id = (select id from e2e_shift_targets where rn = 1);

set local role authenticated;
select set_config('request.jwt.claim.sub', (select admin_id::text from e2e_context), true);
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', (select admin_id from e2e_context), 'role', 'authenticated'
)::text, true);
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

-- Payroll items are now created at schedule confirmation time, not via attendance.
-- For the directly-inserted 2001-01-06 assignment, insert payroll data manually.
insert into public.monthly_payrolls (worker_id, year_month)
select worker.id, date '2001-01-01'
from (select id from e2e_workers where rn = 1) worker
on conflict (worker_id, year_month) do nothing;

insert into public.payroll_items (assignment_id, payroll_id, regular_minutes, overtime_minutes, amount)
select
  assignment.id, mp.id,
  540, 60, 105000
from public.shift_assignments assignment
join public.shifts shift on shift.id = assignment.shift_id
join public.monthly_payrolls mp on mp.worker_id = assignment.worker_id
  and mp.year_month = date '2001-01-01'
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

-- Admin worker-profile update (name, wage, positions, hired_at) applies atomically.
select public.admin_update_worker_profile(
  (select id from e2e_workers where rn = 1),
  'E2E검증근로자1수정',
  12000,
  array['scan', 'main'],
  date '2020-01-15'
);

insert into e2e_results
select 'worker_profile_updated', jsonb_build_object(
  'name', name,
  'hourlyWage', hourly_wage,
  'hiredAt', hired_at::text,
  'positionIds', (
    select coalesce(jsonb_agg(position_id order by position_id), '[]'::jsonb)
    from public.worker_position_skills
    where worker_id = (select id from e2e_workers where rn = 1)
  )
)
from public.profiles
where id = (select id from e2e_workers where rn = 1);

do $$
begin
  begin
    perform public.admin_update_worker_profile(
      (select id from e2e_workers where rn = 1),
      'E2E검증근로자1미래',
      12000,
      array['scan'],
      (current_date + interval '1 day')::date
    );
    raise exception 'EXPECTED_INVALID_PROFILE';
  exception
    when others then
      if sqlerrm = 'INVALID_PROFILE' then
        insert into e2e_results values ('worker_profile_future_hired_at_rejected', 'true'::jsonb);
      elsif sqlerrm = 'EXPECTED_INVALID_PROFILE' then
        raise exception 'WORKER_PROFILE_FUTURE_HIRED_AT_NOT_REJECTED';
      else
        raise;
      end if;
  end;
end;
$$;

-- A non-admin worker cannot call the admin-only profile update RPC.
select set_config('request.jwt.claim.sub', (select id::text from e2e_workers where rn = 2), true);
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', (select id from e2e_workers where rn = 2), 'role', 'authenticated'
)::text, true);

do $$
begin
  begin
    perform public.admin_update_worker_profile(
      (select id from e2e_workers where rn = 1),
      'E2E검증근로자1비관리자수정',
      12000,
      array['scan'],
      date '2020-01-15'
    );
    raise exception 'EXPECTED_WORKER_PROFILE_UPDATE_FORBIDDEN';
  exception
    when others then
      if sqlerrm = 'FORBIDDEN' then
        insert into e2e_results values ('worker_profile_update_forbidden', 'true'::jsonb);
      elsif sqlerrm = 'EXPECTED_WORKER_PROFILE_UPDATE_FORBIDDEN' then
        raise exception 'WORKER_PROFILE_UPDATE_NOT_REJECTED';
      else
        raise;
      end if;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', (select worker_id::text from e2e_context), true);
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', (select worker_id from e2e_context), 'role', 'authenticated'
)::text, true);

do $$
begin
  begin
    perform public.save_schedule_application_period(
      '40000000-0000-4000-8000-000000000016',
      date '2099-02-01', timestamptz '2099-01-15 23:59:59+09', null, null
    );
    raise exception 'EXPECTED_FORBIDDEN';
  exception
    when others then
      if sqlerrm = 'FORBIDDEN' then
        insert into e2e_results values ('worker_admin_rpc_forbidden', 'true'::jsonb);
      elsif sqlerrm = 'EXPECTED_FORBIDDEN' then
        raise exception 'WORKER_ADMIN_RPC_NOT_REJECTED';
      else
        raise;
      end if;
  end;
end;
$$;

set local role authenticated;
insert into e2e_results
select 'worker_isolation', jsonb_build_object(
  'otherPayrollCount', (
    select count(*) from public.monthly_payrolls
    where worker_id = (select id from e2e_workers where rn = 1)
  ),
  'unassignedShiftCount', (
    select count(*) from public.shifts
    where application_period_id =
      (select (value ->> 'periodId')::uuid from e2e_results where key = 'period_created')
  )
);

select set_config('request.jwt.claim.sub', (select id::text from e2e_workers where rn = 1), true);
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', (select id from e2e_workers where rn = 1), 'role', 'authenticated'
)::text, true);
insert into e2e_results
select 'worker_rls', jsonb_build_object(
  'visibleFutureShiftCount', (
    select count(*) from public.shifts
    where application_period_id =
      (select (value ->> 'periodId')::uuid from e2e_results where key = 'period_created')
  ),
  'ownPayrollCount', (
    select count(*) from public.monthly_payrolls
    where worker_id = (select id from e2e_workers where rn = 1)
  ),
  'ownPayrollItemCount', (select count(*) from public.payroll_items)
);
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
  'applicationIdempotencyConflictRejected',
    (select value = 'true'::jsonb from e2e_results where key = 'application_idempotency_conflict'),
  'monthlyNonApplicantRejected',
    (select value = 'true'::jsonb from e2e_results where key = 'monthly_non_applicant_rejected'),
  'dailyNonApplicantRejected',
    (select value = 'true'::jsonb from e2e_results where key = 'daily_non_applicant_rejected'),
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
  'staleShiftRejected',
    (select value = 'true'::jsonb from e2e_results where key = 'stale_shift_rejected'),
  'failedDailyUpdateRolledBack',
    (select (value ->> 'requestCount')::integer = 0
      and (value ->> 'shiftUnchanged')::boolean
      from e2e_results where key = 'failed_daily_update_rollback'),
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
  'workerAdminRpcForbidden',
    (select value = 'true'::jsonb from e2e_results where key = 'worker_admin_rpc_forbidden'),
  'workerIsolationEnforced',
    (select (value ->> 'otherPayrollCount')::integer = 0
      and (value ->> 'unassignedShiftCount')::integer = 0
      from e2e_results where key = 'worker_isolation'),
  'workerOwnShiftCount', (select (value ->> 'visibleFutureShiftCount')::integer
    from e2e_results where key = 'worker_rls'),
  'workerOwnPayrollReadable',
    (select (value ->> 'ownPayrollCount')::integer >= 1
      and (value ->> 'ownPayrollItemCount')::integer >= 1
      from e2e_results where key = 'worker_rls'),
  'workerProfileUpdated',
    (select (value ->> 'name') = 'E2E검증근로자1수정'
      and (value ->> 'hourlyWage')::integer = 12000
      and (value ->> 'hiredAt') = '2020-01-15'
      and value -> 'positionIds' = '["main", "scan"]'::jsonb
      from e2e_results where key = 'worker_profile_updated'),
  'workerProfileFutureHiredAtRejected',
    (select value = 'true'::jsonb
      from e2e_results where key = 'worker_profile_future_hired_at_rejected'),
  'workerProfileUpdateForbidden',
    (select value = 'true'::jsonb
      from e2e_results where key = 'worker_profile_update_forbidden')
);

do $$
declare evidence jsonb;
begin
  select value into evidence from e2e_results where key = 'assertions';
  if evidence ->> 'signupAccepted' is distinct from 'true'
     or evidence ->> 'applicationReplayMatches' is distinct from 'true'
     or evidence ->> 'applicationIdempotencyConflictRejected' is distinct from 'true'
     or evidence ->> 'monthlyNonApplicantRejected' is distinct from 'true'
     or evidence ->> 'dailyNonApplicantRejected' is distinct from 'true'
     or evidence ->> 'publishReplayMatches' is distinct from 'true'
     or (evidence ->> 'publishedShiftCount')::integer is distinct from 2
     or (evidence ->> 'cancelledShiftCount')::integer is distinct from 1
     or evidence ->> 'assignmentRevisionPreserved' is distinct from 'true'
     or (evidence ->> 'scheduleChangedNotificationCount')::integer is distinct from 1
     or evidence ->> 'staleShiftRejected' is distinct from 'true'
     or evidence ->> 'failedDailyUpdateRolledBack' is distinct from 'true'
     or (evidence ->> 'activePayrollAmount')::integer is distinct from 105000
     or (evidence ->> 'voidedPayrollRevisionCount')::integer is distinct from 0
     or evidence ->> 'noticeDeleted' is distinct from 'true'
     or (evidence ->> 'noticeReadCount')::integer is distinct from 1
     or evidence ->> 'inviteReplayMatches' is distinct from 'true'
     or evidence ->> 'workerAdminRpcForbidden' is distinct from 'true'
     or evidence ->> 'workerIsolationEnforced' is distinct from 'true'
     or (evidence ->> 'workerOwnShiftCount')::integer is distinct from 1
     or evidence ->> 'workerOwnPayrollReadable' is distinct from 'true'
     or evidence ->> 'workerProfileUpdated' is distinct from 'true'
     or evidence ->> 'workerProfileFutureHiredAtRejected' is distinct from 'true'
     or evidence ->> 'workerProfileUpdateForbidden' is distinct from 'true' then
    raise exception 'MVP_E2E_ASSERTION_FAILED: %', evidence;
  end if;
end;
$$;

select value as mvp_e2e_evidence from e2e_results where key = 'assertions';
rollback;
