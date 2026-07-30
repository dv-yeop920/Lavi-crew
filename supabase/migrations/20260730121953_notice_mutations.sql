-- Remote migration version: 20260730121953.
do $$
begin
  if exists (select 1 from public.notices where status = 'deleted') then
    raise exception 'MIGRATION_BLOCKED_LEGACY_DELETED_NOTICE';
  end if;
end;
$$;

alter table public.notices
  add column deleted_by uuid references public.profiles(id) on delete restrict,
  add constraint notices_deletion_audit_check check (
    (status = 'published' and deleted_at is null and deleted_by is null)
    or (status = 'deleted' and deleted_at is not null and deleted_by is not null)
  );

create index notices_deleted_by_idx on public.notices (deleted_by) where deleted_by is not null;

create table private.notice_mutation_requests (
  request_id uuid primary key,
  requested_by uuid not null references public.profiles(id) on delete restrict,
  operation text not null check (operation in ('create', 'update', 'delete', 'read')),
  target_id uuid,
  payload_hash text not null,
  result jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table private.notice_mutation_requests enable row level security;
revoke all on private.notice_mutation_requests from public, anon, authenticated;
create index notice_mutation_requests_actor_idx
  on private.notice_mutation_requests (requested_by, created_at desc);

create function public.create_notice(
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

create function public.update_notice(
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
  if not found or notice_record.status <> 'published' then raise exception 'NOTICE_NOT_FOUND'; end if;
  if notice_record.updated_at <> p_expected_updated_at then raise exception 'STALE_NOTICE'; end if;
  update public.notices set title = trim(p_title), content = trim(p_content),
    is_pinned = p_is_pinned where id = p_notice_id returning * into notice_record;
  result_value := jsonb_build_object('noticeId', notice_record.id, 'updatedAt', notice_record.updated_at);
  update private.notice_mutation_requests set result = result_value, completed_at = now()
    where request_id = p_request_id;
  return result_value;
end;
$$;

create function public.delete_notice(
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
  if not found or notice_record.status <> 'published' then raise exception 'NOTICE_NOT_FOUND'; end if;
  if notice_record.updated_at <> p_expected_updated_at then raise exception 'STALE_NOTICE'; end if;
  update public.notices set status = 'deleted', deleted_at = now(), deleted_by = caller_id
    where id = p_notice_id returning * into notice_record;
  result_value := jsonb_build_object('noticeId', notice_record.id, 'deletedAt', notice_record.deleted_at);
  update private.notice_mutation_requests set result = result_value, completed_at = now()
    where request_id = p_request_id;
  return result_value;
end;
$$;

create function public.mark_notice_read(p_request_id uuid, p_notice_id uuid)
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
  if not exists (select 1 from public.notices where id = p_notice_id and status = 'published')
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

drop policy if exists "notices read published or admin" on public.notices;
drop policy if exists "admin inserts notices" on public.notices;
drop policy if exists "admin updates notices" on public.notices;
create policy "notices read published or admin" on public.notices for select to authenticated
using (
  (status = 'published' and (select private.is_active_user()))
  or (select private.is_admin())
);
drop policy if exists "notice reads read own or admin" on public.notice_reads;
drop policy if exists "workers insert own notice reads" on public.notice_reads;
drop policy if exists "workers create own notice reads" on public.notice_reads;
create policy "notice reads read own or admin" on public.notice_reads for select to authenticated
using (
  (worker_id = (select auth.uid()) and (select private.is_active_user()))
  or (select private.is_admin())
);
revoke insert, update, delete on public.notices, public.notice_reads from anon, authenticated;
grant select on public.notices, public.notice_reads to authenticated;

revoke all on function public.create_notice(uuid, text, text, boolean) from public, anon;
revoke all on function public.update_notice(uuid, uuid, timestamptz, text, text, boolean) from public, anon;
revoke all on function public.delete_notice(uuid, uuid, timestamptz) from public, anon;
revoke all on function public.mark_notice_read(uuid, uuid) from public, anon;
grant execute on function public.create_notice(uuid, text, text, boolean) to authenticated;
grant execute on function public.update_notice(uuid, uuid, timestamptz, text, text, boolean) to authenticated;
grant execute on function public.delete_notice(uuid, uuid, timestamptz) to authenticated;
grant execute on function public.mark_notice_read(uuid, uuid) to authenticated;
