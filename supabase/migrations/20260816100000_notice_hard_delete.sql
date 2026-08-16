-- Change notice deletion from soft delete to physical DELETE.
-- notice_reads cascade on delete; notification_logs has no FK to notices.

-- 1. Change notice_reads FK to CASCADE so reads are removed with the notice.
alter table public.notice_reads
  drop constraint notice_reads_notice_id_fkey,
  add constraint notice_reads_notice_id_fkey
    foreign key (notice_id) references public.notices(id) on delete cascade;

-- 2. Drop RLS policy that depends on the status column.
drop policy if exists "notices read published or admin" on public.notices;

-- 3. Drop partial index that depends on the status column.
drop index if exists notices_published_idx;

-- 4. Drop soft-delete audit constraint and columns (including status).
alter table public.notices
  drop constraint notices_deletion_audit_check,
  drop column deleted_by,
  drop column deleted_at,
  drop column status;

drop index if exists notices_deleted_by_idx;

-- 5. Drop orphan notice_status enum.
drop type if exists public.notice_status;

-- 6. Replace delete_notice RPC with physical DELETE.
create or replace function public.delete_notice(
  p_request_id uuid, p_notice_id uuid, p_expected_updated_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  request_record private.notice_mutation_requests;
  notice_record public.notices;
  payload_hash_value text;
  result_value jsonb;
begin
  if caller_id is null or not private.is_active_user() or not private.is_admin()
  then raise exception 'FORBIDDEN'; end if;
  if p_request_id is null or p_notice_id is null or p_expected_updated_at is null
  then raise exception 'INVALID_INPUT'; end if;
  payload_hash_value := encode(extensions.digest(convert_to(jsonb_build_object(
    'notice_id', p_notice_id, 'expected', p_expected_updated_at
  )::text, 'UTF8'), 'sha256'), 'hex');
  insert into private.notice_mutation_requests
    (request_id, requested_by, operation, target_id, payload_hash)
  values (p_request_id, caller_id, 'delete', p_notice_id, payload_hash_value)
  on conflict (request_id) do nothing;
  select * into request_record from private.notice_mutation_requests
    where request_id = p_request_id for update;
  if request_record.requested_by <> caller_id or request_record.operation <> 'delete'
     or request_record.target_id <> p_notice_id or request_record.payload_hash <> payload_hash_value
  then raise exception 'IDEMPOTENCY_KEY_REUSED'; end if;
  if request_record.result is not null then return request_record.result; end if;
  select * into notice_record from public.notices where id = p_notice_id for update;
  if not found then raise exception 'NOTICE_NOT_FOUND'; end if;
  if notice_record.updated_at <> p_expected_updated_at then raise exception 'STALE_NOTICE'; end if;
  delete from public.notices where id = p_notice_id;
  result_value := jsonb_build_object('noticeId', p_notice_id, 'deletedAt', now());
  update private.notice_mutation_requests set result = result_value, completed_at = now()
    where request_id = p_request_id;
  return result_value;
end;
$$;

-- 7. Recreate RLS — no status filter needed.
create policy "notices read active or admin" on public.notices for select to authenticated
using (
  (select private.is_active_user())
  or (select private.is_admin())
);

-- 8. Update create_notice and update_notice to remove status references.
create or replace function public.create_notice(
  p_request_id uuid, p_title text, p_content text, p_is_pinned boolean
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  request_record private.notice_mutation_requests;
  notice_record public.notices;
  payload_hash_value text;
  result_value jsonb;
begin
  if caller_id is null or not private.is_active_user() or not private.is_admin()
  then raise exception 'FORBIDDEN'; end if;
  if p_request_id is null or char_length(trim(coalesce(p_title, ''))) not between 1 and 120
     or char_length(trim(coalesce(p_content, ''))) not between 1 and 10000
     or p_is_pinned is null then raise exception 'INVALID_INPUT'; end if;
  payload_hash_value := encode(extensions.digest(convert_to(jsonb_build_object(
    'title', trim(p_title), 'content', trim(p_content), 'is_pinned', p_is_pinned
  )::text, 'UTF8'), 'sha256'), 'hex');
  insert into private.notice_mutation_requests
    (request_id, requested_by, operation, payload_hash)
  values (p_request_id, caller_id, 'create', payload_hash_value)
  on conflict (request_id) do nothing;
  select * into request_record from private.notice_mutation_requests
    where request_id = p_request_id for update;
  if request_record.requested_by <> caller_id or request_record.operation <> 'create'
     or request_record.payload_hash <> payload_hash_value
  then raise exception 'IDEMPOTENCY_KEY_REUSED'; end if;
  if request_record.result is not null then return request_record.result; end if;
  insert into public.notices (title, content, is_pinned, author_id)
    values (trim(p_title), trim(p_content), p_is_pinned, caller_id)
    returning * into notice_record;
  result_value := jsonb_build_object('noticeId', notice_record.id, 'updatedAt', notice_record.updated_at);
  update private.notice_mutation_requests set target_id = notice_record.id,
    result = result_value, completed_at = now() where request_id = p_request_id;
  return result_value;
end;
$$;

create or replace function public.update_notice(
  p_request_id uuid, p_notice_id uuid, p_expected_updated_at timestamptz,
  p_title text, p_content text, p_is_pinned boolean
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  request_record private.notice_mutation_requests;
  notice_record public.notices;
  payload_hash_value text;
  result_value jsonb;
begin
  if caller_id is null or not private.is_active_user() or not private.is_admin()
  then raise exception 'FORBIDDEN'; end if;
  if p_request_id is null or p_notice_id is null or p_expected_updated_at is null
     or char_length(trim(coalesce(p_title, ''))) not between 1 and 120
     or char_length(trim(coalesce(p_content, ''))) not between 1 and 10000
     or p_is_pinned is null then raise exception 'INVALID_INPUT'; end if;
  payload_hash_value := encode(extensions.digest(convert_to(jsonb_build_object(
    'notice_id', p_notice_id, 'expected', p_expected_updated_at,
    'title', trim(p_title), 'content', trim(p_content), 'is_pinned', p_is_pinned
  )::text, 'UTF8'), 'sha256'), 'hex');
  insert into private.notice_mutation_requests
    (request_id, requested_by, operation, target_id, payload_hash)
  values (p_request_id, caller_id, 'update', p_notice_id, payload_hash_value)
  on conflict (request_id) do nothing;
  select * into request_record from private.notice_mutation_requests
    where request_id = p_request_id for update;
  if request_record.requested_by <> caller_id or request_record.operation <> 'update'
     or request_record.target_id <> p_notice_id or request_record.payload_hash <> payload_hash_value
  then raise exception 'IDEMPOTENCY_KEY_REUSED'; end if;
  if request_record.result is not null then return request_record.result; end if;
  select * into notice_record from public.notices where id = p_notice_id for update;
  if not found then raise exception 'NOTICE_NOT_FOUND'; end if;
  if notice_record.updated_at <> p_expected_updated_at then raise exception 'STALE_NOTICE'; end if;
  update public.notices set title = trim(p_title), content = trim(p_content),
    is_pinned = p_is_pinned where id = p_notice_id returning * into notice_record;
  result_value := jsonb_build_object('noticeId', notice_record.id, 'updatedAt', notice_record.updated_at);
  update private.notice_mutation_requests set result = result_value, completed_at = now()
    where request_id = p_request_id;
  return result_value;
end;
$$;

-- 9. Update mark_notice_read to remove status check.
create or replace function public.mark_notice_read(p_request_id uuid, p_notice_id uuid)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_role public.app_role;
  request_record private.notice_mutation_requests;
  payload_hash_value text;
  result_value jsonb;
  read_at_value timestamptz;
begin
  select role into caller_role from public.profiles where id = caller_id and is_active;
  if caller_role is distinct from 'worker' then raise exception 'FORBIDDEN'; end if;
  if p_request_id is null or p_notice_id is null then raise exception 'INVALID_INPUT'; end if;
  if not exists (select 1 from public.notices where id = p_notice_id)
  then raise exception 'NOTICE_NOT_FOUND'; end if;
  payload_hash_value := encode(extensions.digest(convert_to(jsonb_build_object(
    'notice_id', p_notice_id
  )::text, 'UTF8'), 'sha256'), 'hex');
  insert into private.notice_mutation_requests
    (request_id, requested_by, operation, target_id, payload_hash)
  values (p_request_id, caller_id, 'read', p_notice_id, payload_hash_value)
  on conflict (request_id) do nothing;
  select * into request_record from private.notice_mutation_requests
    where request_id = p_request_id for update;
  if request_record.requested_by <> caller_id or request_record.operation <> 'read'
     or request_record.target_id <> p_notice_id or request_record.payload_hash <> payload_hash_value
  then raise exception 'IDEMPOTENCY_KEY_REUSED'; end if;
  if request_record.result is not null then return request_record.result; end if;
  insert into public.notice_reads (notice_id, worker_id)
    values (p_notice_id, caller_id)
    on conflict (notice_id, worker_id) do update set read_at = public.notice_reads.read_at
    returning read_at into read_at_value;
  result_value := jsonb_build_object('noticeId', p_notice_id, 'readAt', read_at_value);
  update private.notice_mutation_requests set result = result_value, completed_at = now()
    where request_id = p_request_id;
  return result_value;
end;
$$;

-- 10. Create new index for common query pattern.
create index notices_pinned_created_idx
  on public.notices (is_pinned desc, created_at desc);
