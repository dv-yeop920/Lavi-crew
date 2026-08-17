-- Notify active workers with a push subscription when the admin opens a new
-- monthly schedule application period, and let the outbox processor claim
-- these notifications even though they have no associated shift.

alter type public.notification_type add value if not exists 'schedule_opened';

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
  notification_count integer := 0;
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

    insert into public.notification_logs (
      recipient_id,
      shift_id,
      assignment_id,
      type,
      channel,
      delivery_status,
      correlation_id
    )
    select
      profile.id,
      null::uuid,
      null::uuid,
      'schedule_opened'::public.notification_type,
      'web_push',
      'pending',
      p_request_id
    from public.profiles profile
    where profile.role = 'worker'
      and profile.is_active
      and exists (
        select 1 from public.push_subscriptions ps where ps.user_id = profile.id
      );
    get diagnostics notification_count = row_count;
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
    'updatedAt', period_record.updated_at,
    'pendingNotificationCount', notification_count
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

-- Let the outbox processor claim notifications that have no associated shift
-- (e.g. schedule_opened), and stop treating a null shift_id as ineligible.
create or replace function public.claim_pending_notifications(
  p_batch_size integer default 5,
  p_lease_seconds integer default 60
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed_payload jsonb;
begin
  if p_batch_size is null or p_batch_size not between 1 and 5
     or p_lease_seconds is null or p_lease_seconds not between 60 and 300
  then
    raise exception 'INVALID_PROCESSOR_INPUT';
  end if;

  update public.notification_logs notification
  set delivery_status = 'failed',
      error_code = 'ERROR_RETRY_EXHAUSTED',
      failure_reason = 'Notification retry limit was exhausted.',
      locked_at = null,
      locked_until = null,
      lease_token = null
  where notification.delivery_status = 'pending'
    and notification.channel = 'web_push'
    and notification.attempt_count >= 3
    and notification.next_attempt_at <= now()
    and (notification.locked_until is null or notification.locked_until <= now());

  -- Mark ineligible recipients (no active profile, no push subscription, or a
  -- shift-linked notification whose shift no longer exists). A null shift_id
  -- is valid for notification types that are not tied to a specific shift.
  update public.notification_logs notification
  set delivery_status = 'failed',
      error_code = 'RECIPIENT_INELIGIBLE',
      failure_reason = 'Recipient has no active push subscription.',
      locked_at = null,
      locked_until = null,
      lease_token = null
  where notification.delivery_status = 'pending'
    and notification.channel = 'web_push'
    and notification.next_attempt_at <= now()
    and (notification.locked_until is null or notification.locked_until <= now())
    and (
      not exists (
        select 1
        from public.profiles profile
        where profile.id = notification.recipient_id
          and profile.is_active
      )
      or not exists (
        select 1
        from public.push_subscriptions ps
        where ps.user_id = notification.recipient_id
      )
      or (
        notification.shift_id is not null
        and not exists (
          select 1 from public.shifts shift_record
          where shift_record.id = notification.shift_id
        )
      )
    );

  -- Claim eligible pending notifications
  with candidates as (
    select notification.id
    from public.notification_logs notification
    join public.profiles profile on profile.id = notification.recipient_id
    where notification.delivery_status = 'pending'
      and notification.channel = 'web_push'
      and notification.attempt_count < 3
      and notification.next_attempt_at <= now()
      and (notification.locked_until is null or notification.locked_until <= now())
      and profile.is_active
      and exists (
        select 1 from public.push_subscriptions ps
        where ps.user_id = notification.recipient_id
      )
    order by notification.next_attempt_at, notification.created_at, notification.id
    for update of notification skip locked
    limit p_batch_size
  ),
  claimed as (
    update public.notification_logs notification
    set attempt_count = notification.attempt_count + 1,
        last_attempt_at = now(),
        locked_at = now(),
        locked_until = now() + make_interval(secs => p_lease_seconds),
        lease_token = pg_catalog.gen_random_uuid()
    from candidates
    where notification.id = candidates.id
    returning notification.*
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'notificationId', claimed.id,
        'leaseToken', claimed.lease_token,
        'type', claimed.type,
        'recipientName', profile.name,
        'subscriptions', (
          select jsonb_agg(jsonb_build_object(
            'endpoint', ps.endpoint,
            'keyP256dh', ps.key_p256dh,
            'keyAuth', ps.key_auth
          ))
          from public.push_subscriptions ps
          where ps.user_id = claimed.recipient_id
        ),
        'workDate', shift_record.work_date,
        'startTime', shift_record.start_time,
        'endTime', shift_record.end_time
      )
      order by claimed.next_attempt_at, claimed.created_at, claimed.id
    ),
    '[]'::jsonb
  )
  into claimed_payload
  from claimed
  join public.profiles profile on profile.id = claimed.recipient_id
  left join public.shifts shift_record on shift_record.id = claimed.shift_id;

  return claimed_payload;
end;
$$;

revoke all on function public.claim_pending_notifications(integer, integer)
  from public, anon, authenticated, service_role;
grant execute on function public.claim_pending_notifications(integer, integer)
  to service_role;
