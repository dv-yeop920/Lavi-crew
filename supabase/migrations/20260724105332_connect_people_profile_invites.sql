alter table public.profiles
  add column email text;

update public.profiles profile
set email = lower(auth_user.email)
from auth.users auth_user
where auth_user.id = profile.id
  and auth_user.email is not null;

alter table public.profiles
  add constraint profiles_email_format_check
  check (email is null or email = lower(trim(email)));

create unique index profiles_email_unique_idx
  on public.profiles (email)
  where email is not null;

alter table public.invite_codes
  add column label text not null default '초대 코드'
  check (char_length(trim(label)) between 1 and 60);

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed_invite uuid;
begin
  -- OAuth users finish onboarding after the provider callback.
  if coalesce(new.raw_user_meta_data ->> 'invite_code', '') = '' then
    return new;
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

  insert into public.profiles (id, email, name, phone, kakao_consent)
  values (
    new.id,
    lower(new.email),
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'phone',
    coalesce((new.raw_user_meta_data ->> 'kakao_consent')::boolean, false)
  );

  return new;
end;
$$;

create or replace function public.complete_worker_onboarding(
  candidate_name text,
  candidate_phone text,
  candidate_invite_code text,
  consent boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed_invite uuid;
  account_email text;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHENTICATED';
  end if;
  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'PROFILE_ALREADY_EXISTS';
  end if;
  if char_length(trim(candidate_name)) < 2
    or candidate_phone !~ '^01[0-9]{8,9}$'
  then
    raise exception 'INVALID_PROFILE';
  end if;

  select lower(email)
    into account_email
    from auth.users
   where id = auth.uid();

  update public.invite_codes
     set used_count = used_count + 1
   where id = (
     select id
       from public.invite_codes
      where code = upper(trim(candidate_invite_code))
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

  insert into public.profiles (id, email, name, phone, kakao_consent)
  values (auth.uid(), account_email, trim(candidate_name), candidate_phone, consent);
end;
$$;

create or replace function private.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles
       set email = lower(new.email)
     where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists auth_user_email_syncs_profile on auth.users;
create trigger auth_user_email_syncs_profile
after update of email on auth.users
for each row
execute function private.sync_profile_email();

create or replace function public.admin_update_worker_profile(
  target_worker_id uuid,
  candidate_name text,
  candidate_hourly_wage integer,
  candidate_position_ids text[]
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
         hourly_wage = candidate_hourly_wage
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

create or replace function public.admin_deactivate_worker(target_worker_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  update public.profiles
     set is_active = false
   where id = target_worker_id
     and role = 'worker'
     and is_active;

  if not found then
    raise exception 'WORKER_NOT_FOUND_OR_PROTECTED';
  end if;
end;
$$;

create or replace function public.update_own_profile(
  candidate_name text,
  candidate_phone text,
  consent boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_active_user() then
    raise exception 'INACTIVE_ACCOUNT';
  end if;
  if char_length(trim(candidate_name)) < 2
    or candidate_phone !~ '^01[0-9]{8,9}$'
  then
    raise exception 'INVALID_PROFILE';
  end if;

  update public.profiles
     set name = trim(candidate_name),
         phone = candidate_phone,
         kakao_consent = consent
   where id = auth.uid()
     and is_active;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;
end;
$$;

create or replace function public.deactivate_own_profile()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
     set is_active = false
   where id = auth.uid()
     and role = 'worker'
     and is_active;

  if not found then
    raise exception 'PROFILE_NOT_FOUND_OR_PROTECTED';
  end if;
end;
$$;

revoke update on public.profiles from authenticated;
revoke insert, update, delete on public.worker_position_skills from authenticated;

revoke all on function private.sync_profile_email() from public, anon, authenticated;
revoke all on function public.admin_update_worker_profile(uuid, text, integer, text[]) from public, anon;
revoke all on function public.admin_deactivate_worker(uuid) from public, anon;
revoke all on function public.update_own_profile(text, text, boolean) from public, anon;
revoke all on function public.deactivate_own_profile() from public, anon;

grant execute on function public.admin_update_worker_profile(uuid, text, integer, text[]) to authenticated;
grant execute on function public.admin_deactivate_worker(uuid) to authenticated;
grant execute on function public.update_own_profile(text, text, boolean) to authenticated;
grant execute on function public.deactivate_own_profile() to authenticated;

grant select (email) on public.profiles to authenticated;
