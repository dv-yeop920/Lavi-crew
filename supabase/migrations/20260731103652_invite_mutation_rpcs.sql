create table private.invite_mutation_requests (
  request_id uuid primary key,
  requested_by uuid not null references public.profiles(id) on delete restrict,
  operation text not null check (operation in ('create', 'deactivate')),
  target_id uuid references public.invite_codes(id) on delete restrict,
  payload_hash text not null,
  result jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table private.invite_mutation_requests enable row level security;
revoke all on private.invite_mutation_requests from public, anon, authenticated;
create index invite_mutation_requests_actor_idx
  on private.invite_mutation_requests (requested_by, created_at desc);

create function public.create_invite_code(
  p_request_id uuid,
  p_code text,
  p_label text,
  p_expires_at timestamptz,
  p_max_uses integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  request_record private.invite_mutation_requests;
  invite_record public.invite_codes;
  payload_hash_value text;
  result_value jsonb;
begin
  if caller_id is null or not private.is_active_user(caller_id) or not private.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if p_request_id is null
     or p_code !~ '^LAVI-[A-F0-9]{12}$'
     or char_length(btrim(p_label)) not between 1 and 60
     or p_expires_at <= now()
     or p_max_uses <= 0 then
    raise exception 'INVALID_INPUT';
  end if;

  payload_hash_value := encode(extensions.digest(convert_to(jsonb_build_object(
    'code', p_code,
    'label', btrim(p_label),
    'expires_at', p_expires_at,
    'max_uses', p_max_uses
  )::text, 'UTF8'), 'sha256'), 'hex');
  insert into private.invite_mutation_requests
    (request_id, requested_by, operation, payload_hash)
  values (p_request_id, caller_id, 'create', payload_hash_value)
  on conflict (request_id) do nothing;
  select * into request_record
  from private.invite_mutation_requests
  where request_id = p_request_id
  for update;
  if request_record.requested_by <> caller_id
     or request_record.operation <> 'create'
     or request_record.payload_hash <> payload_hash_value then
    raise exception 'IDEMPOTENCY_KEY_REUSED';
  end if;
  if request_record.result is not null then return request_record.result; end if;

  insert into public.invite_codes (
    code, label, expires_at, max_uses, created_by
  ) values (
    p_code, btrim(p_label), p_expires_at, p_max_uses, caller_id
  ) returning * into invite_record;

  result_value := jsonb_build_object('inviteId', invite_record.id);
  update private.invite_mutation_requests
  set target_id = invite_record.id, result = result_value, completed_at = now()
  where request_id = p_request_id;
  return result_value;
end;
$$;

create function public.deactivate_invite_code(
  p_request_id uuid,
  p_invite_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  request_record private.invite_mutation_requests;
  invite_record public.invite_codes;
  payload_hash_value text;
  result_value jsonb;
begin
  if caller_id is null or not private.is_active_user(caller_id) or not private.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if p_request_id is null or p_invite_id is null then raise exception 'INVALID_INPUT'; end if;

  payload_hash_value := encode(extensions.digest(convert_to(jsonb_build_object(
    'invite_id', p_invite_id
  )::text, 'UTF8'), 'sha256'), 'hex');
  insert into private.invite_mutation_requests
    (request_id, requested_by, operation, target_id, payload_hash)
  values (p_request_id, caller_id, 'deactivate', p_invite_id, payload_hash_value)
  on conflict (request_id) do nothing;
  select * into request_record
  from private.invite_mutation_requests
  where request_id = p_request_id
  for update;
  if request_record.requested_by <> caller_id
     or request_record.operation <> 'deactivate'
     or request_record.target_id <> p_invite_id
     or request_record.payload_hash <> payload_hash_value then
    raise exception 'IDEMPOTENCY_KEY_REUSED';
  end if;
  if request_record.result is not null then return request_record.result; end if;

  select * into invite_record
  from public.invite_codes
  where id = p_invite_id
  for update;
  if not found then raise exception 'INVITE_NOT_FOUND'; end if;
  if not invite_record.is_active then raise exception 'INVITE_NOT_ACTIVE'; end if;
  update public.invite_codes
  set is_active = false
  where id = p_invite_id
  returning * into invite_record;

  result_value := jsonb_build_object('inviteId', invite_record.id, 'isActive', false);
  update private.invite_mutation_requests
  set result = result_value, completed_at = now()
  where request_id = p_request_id;
  return result_value;
end;
$$;

revoke insert, update, delete on public.invite_codes from anon, authenticated;
revoke all on function public.create_invite_code(uuid, text, text, timestamptz, integer)
  from public, anon;
revoke all on function public.deactivate_invite_code(uuid, uuid)
  from public, anon;
grant execute on function public.create_invite_code(uuid, text, text, timestamptz, integer)
  to authenticated;
grant execute on function public.deactivate_invite_code(uuid, uuid)
  to authenticated;
