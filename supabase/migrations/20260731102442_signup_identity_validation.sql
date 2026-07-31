-- Complete signup identity validation and align historical uniqueness with audit-row models.

do $$
begin
  if exists (
    select 1
    from public.profiles
    group by lower(btrim(name))
    having count(*) > 1
  ) then
    raise exception 'MIGRATION_BLOCKED_DUPLICATE_PROFILE_NAME';
  end if;
end;
$$;

update public.profiles
set name = btrim(name)
where name is distinct from btrim(name);

alter table public.profiles
  add constraint profiles_name_trimmed_check
  check (name = btrim(name));

create unique index profiles_name_normalized_unique_idx
  on public.profiles (lower(name));

create function public.check_signup_identity(
  candidate_name text,
  candidate_phone text,
  candidate_invite_code text
)
returns table (
  is_name_available boolean,
  is_phone_available boolean,
  is_invite_code_valid boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    char_length(btrim(candidate_name)) >= 2
      and not exists (
        select 1
        from public.profiles profile
        where lower(profile.name) = lower(btrim(candidate_name))
      ),
    candidate_phone ~ '^01[0-9]{8,9}$'
      and not exists (
        select 1
        from public.profiles profile
        where profile.phone = candidate_phone
      ),
    exists (
      select 1
      from public.invite_codes invite
      where invite.code = upper(btrim(candidate_invite_code))
        and invite.is_active
        and invite.expires_at > now()
        and invite.used_count < invite.max_uses
    );
$$;

revoke all on function public.check_signup_identity(text, text, text)
  from public, authenticated;
grant execute on function public.check_signup_identity(text, text, text)
  to anon;

alter table public.payroll_items
  drop constraint payroll_items_payroll_id_assignment_id_key;

alter table public.shift_assignments
  drop constraint shift_assignments_shift_id_worker_id_position_id_key;

create unique index active_assignment_worker_per_shift_idx
  on public.shift_assignments (shift_id, worker_id)
  where status <> 'cancelled';
