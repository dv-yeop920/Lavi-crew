-- Base tenure on the actual hire date instead of the signup timestamp.

alter table public.profiles
  add column hired_at date;

update public.profiles
set hired_at = created_at::date
where hired_at is null;

alter table public.profiles
  alter column hired_at set not null;

alter table public.profiles
  add constraint profiles_hired_at_not_future_check
  check (hired_at <= current_date);

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed_invite uuid;
  raw_hired_at text;
  candidate_hired_at date;
begin
  -- OAuth users finish onboarding after the provider callback.
  if coalesce(new.raw_user_meta_data ->> 'invite_code', '') = '' then
    return new;
  end if;

  raw_hired_at := new.raw_user_meta_data ->> 'hired_at';
  if raw_hired_at is null or raw_hired_at !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    raise exception 'INVALID_HIRED_AT';
  end if;

  begin
    candidate_hired_at := raw_hired_at::date;
  exception when others then
    raise exception 'INVALID_HIRED_AT';
  end;

  if candidate_hired_at > current_date then
    raise exception 'INVALID_HIRED_AT';
  end if;

  update public.invite_codes
     set used_count = used_count + 1
   where id = (
     select id
       from public.invite_codes
      where code = upper(trim(new.raw_user_meta_data ->> 'invite_code'))
        and is_active
        and expires_at > now()
        and used_count < max_uses
      for update skip locked
      limit 1
   )
  returning id into claimed_invite;

  if claimed_invite is null then
    raise exception 'INVITE_CODE_INVALID';
  end if;

  insert into public.profiles (id, email, name, phone, hired_at)
  values (
    new.id,
    lower(new.email),
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'phone',
    candidate_hired_at
  );

  return new;
end;
$$;

-- admin_update_worker_profile gains a required hired_at parameter, so the old
-- signature is dropped and replaced rather than overloaded.
drop function public.admin_update_worker_profile(uuid, text, integer, text[]);

create function public.admin_update_worker_profile(
  target_worker_id uuid,
  candidate_name text,
  candidate_hourly_wage integer,
  candidate_position_ids text[],
  candidate_hired_at date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  invalid_position_count integer;
begin
  if not private.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if char_length(trim(candidate_name)) < 2
    or candidate_hourly_wage <= 0
    or candidate_hired_at is null
    or candidate_hired_at > current_date
  then
    raise exception 'INVALID_PROFILE';
  end if;

  select count(*)
    into invalid_position_count
    from unnest(coalesce(candidate_position_ids, array[]::text[]))
      as requested_position(position_id)
   where not exists (
     select 1
       from public.positions position
      where position.id = requested_position.position_id
   );

  if invalid_position_count > 0 then
    raise exception 'INVALID_POSITION';
  end if;

  update public.profiles
     set name = trim(candidate_name),
         hourly_wage = candidate_hourly_wage,
         hired_at = candidate_hired_at
   where id = target_worker_id
     and is_active;

  if not found then
    raise exception 'WORKER_NOT_FOUND_OR_INACTIVE';
  end if;

  delete from public.worker_position_skills
   where worker_id = target_worker_id;

  insert into public.worker_position_skills (worker_id, position_id, assigned_by)
  select target_worker_id, position_id, auth.uid()
    from (
      select distinct unnest(coalesce(candidate_position_ids, array[]::text[])) as position_id
    ) positions;
end;
$$;

revoke all on function public.admin_update_worker_profile(uuid, text, integer, text[], date)
  from public, anon;
grant execute on function public.admin_update_worker_profile(uuid, text, integer, text[], date)
  to authenticated;
