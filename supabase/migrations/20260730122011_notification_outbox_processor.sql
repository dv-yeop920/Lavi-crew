-- Remote migration version: 20260730122011.
alter table public.notification_logs
  add column attempt_count integer not null default 0,
  add column next_attempt_at timestamptz,
  add column locked_at timestamptz,
  add column locked_until timestamptz,
  add column lease_token uuid,
  add column last_attempt_at timestamptz,
  add column error_code text,
  add constraint notification_logs_attempt_count_check
    check (attempt_count between 0 and 3),
  add constraint notification_logs_lease_check check (
    (locked_at is null and locked_until is null and lease_token is null)
    or (locked_at is not null and locked_until is not null and lease_token is not null)
  ),
  add constraint notification_logs_error_code_check
    check (error_code is null or char_length(error_code) between 1 and 64);

update public.notification_logs
set next_attempt_at = created_at
where next_attempt_at is null;

alter table public.notification_logs
  alter column next_attempt_at set default now(),
  alter column next_attempt_at set not null;

create index notification_logs_pending_delivery_idx
  on public.notification_logs (next_attempt_at, locked_until, created_at)
  where delivery_status = 'pending';

create function public.claim_pending_notifications(
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
    and notification.channel = 'kakao_alimtalk'
    and notification.attempt_count >= 3
    and notification.next_attempt_at <= now()
    and (notification.locked_until is null or notification.locked_until <= now());

  update public.notification_logs notification
  set delivery_status = 'failed',
      error_code = 'RECIPIENT_INELIGIBLE',
      failure_reason = 'Recipient is not eligible for Kakao Alimtalk delivery.',
      locked_at = null,
      locked_until = null,
      lease_token = null
  where notification.delivery_status = 'pending'
    and notification.channel = 'kakao_alimtalk'
    and notification.next_attempt_at <= now()
    and (notification.locked_until is null or notification.locked_until <= now())
    and (
      notification.shift_id is null
      or not exists (
        select 1
        from public.profiles profile
        where profile.id = notification.recipient_id
          and profile.is_active
          and profile.kakao_consent
          and regexp_replace(profile.phone, '[^0-9]', '', 'g')
            ~ '^01[016789][0-9]{7,8}$'
      )
      or not exists (
        select 1 from public.shifts shift_record
        where shift_record.id = notification.shift_id
      )
    );

  with candidates as (
    select notification.id
    from public.notification_logs notification
    join public.profiles profile on profile.id = notification.recipient_id
    join public.shifts shift_record on shift_record.id = notification.shift_id
    where notification.delivery_status = 'pending'
      and notification.channel = 'kakao_alimtalk'
      and notification.attempt_count < 3
      and notification.next_attempt_at <= now()
      and (notification.locked_until is null or notification.locked_until <= now())
      and profile.is_active
      and profile.kakao_consent
      and regexp_replace(profile.phone, '[^0-9]', '', 'g')
        ~ '^01[016789][0-9]{7,8}$'
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
        'recipientPhone', regexp_replace(profile.phone, '[^0-9]', '', 'g'),
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
  join public.shifts shift_record on shift_record.id = claimed.shift_id;

  return claimed_payload;
end;
$$;

create function public.complete_notification(
  p_notification_id uuid,
  p_lease_token uuid,
  p_provider_message_id text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  completed public.notification_logs;
begin
  if p_notification_id is null or p_lease_token is null
     or char_length(trim(coalesce(p_provider_message_id, ''))) not between 1 and 200
  then
    raise exception 'INVALID_PROCESSOR_INPUT';
  end if;

  update public.notification_logs
  set delivery_status = 'sent',
      provider_message_id = trim(p_provider_message_id),
      sent_at = now(),
      failure_reason = null,
      error_code = null,
      locked_at = null,
      locked_until = null,
      lease_token = null
  where id = p_notification_id
    and delivery_status = 'pending'
    and lease_token = p_lease_token
  returning * into completed;

  if not found then
    raise exception 'NOTIFICATION_LEASE_MISMATCH';
  end if;

  return jsonb_build_object(
    'notificationId', completed.id,
    'status', completed.delivery_status,
    'sentAt', completed.sent_at
  );
end;
$$;

create function public.retry_or_fail_notification(
  p_notification_id uuid,
  p_lease_token uuid,
  p_error_code text,
  p_failure_reason text,
  p_is_transient boolean
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_record public.notification_logs;
  updated_record public.notification_logs;
  safe_error_code text;
  safe_failure_reason text;
  retry_delay interval;
begin
  if p_notification_id is null or p_lease_token is null or p_is_transient is null
  then
    raise exception 'INVALID_PROCESSOR_INPUT';
  end if;

  safe_error_code := upper(regexp_replace(trim(coalesce(p_error_code, '')), '[^A-Za-z0-9_:-]', '_', 'g'));
  safe_failure_reason := trim(coalesce(p_failure_reason, ''));
  if char_length(safe_error_code) not between 1 and 64
     or char_length(safe_failure_reason) not between 1 and 500
  then
    raise exception 'INVALID_PROCESSOR_INPUT';
  end if;

  select * into current_record
  from public.notification_logs
  where id = p_notification_id
    and delivery_status = 'pending'
    and lease_token = p_lease_token
  for update;

  if not found then
    raise exception 'NOTIFICATION_LEASE_MISMATCH';
  end if;

  retry_delay := make_interval(secs => 60 * power(2, greatest(current_record.attempt_count - 1, 0))::integer);

  update public.notification_logs
  set delivery_status = case
        when p_is_transient and current_record.attempt_count < 3 then 'pending'::public.notification_delivery_status
        else 'failed'::public.notification_delivery_status
      end,
      next_attempt_at = case
        when p_is_transient and current_record.attempt_count < 3 then now() + retry_delay
        else next_attempt_at
      end,
      error_code = safe_error_code,
      failure_reason = safe_failure_reason,
      locked_at = null,
      locked_until = null,
      lease_token = null
  where id = p_notification_id
  returning * into updated_record;

  return jsonb_build_object(
    'notificationId', updated_record.id,
    'status', updated_record.delivery_status,
    'attemptCount', updated_record.attempt_count,
    'nextAttemptAt', case
      when updated_record.delivery_status = 'pending' then updated_record.next_attempt_at
      else null
    end
  );
end;
$$;

drop policy if exists "admin manages notifications" on public.notification_logs;
drop policy if exists "admin inserts notifications" on public.notification_logs;
drop policy if exists "admin updates notifications" on public.notification_logs;

revoke insert, update, delete on public.notification_logs
  from public, anon, authenticated, service_role;

revoke all on function public.claim_pending_notifications(integer, integer)
  from public, anon, authenticated, service_role;
revoke all on function public.complete_notification(uuid, uuid, text)
  from public, anon, authenticated, service_role;
revoke all on function public.retry_or_fail_notification(uuid, uuid, text, text, boolean)
  from public, anon, authenticated, service_role;

grant execute on function public.claim_pending_notifications(integer, integer)
  to service_role;
grant execute on function public.complete_notification(uuid, uuid, text)
  to service_role;
grant execute on function public.retry_or_fail_notification(uuid, uuid, text, text, boolean)
  to service_role;
