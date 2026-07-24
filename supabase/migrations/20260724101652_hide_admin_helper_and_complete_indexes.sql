create schema if not exists private;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.profiles
      where id = (select auth.uid())
        and role = 'admin'
        and is_active
    );
$$;

revoke all on function private.is_admin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.is_admin();
$$;

create index if not exists notice_reads_worker_id_idx
  on public.notice_reads (worker_id);
create index if not exists payroll_items_assignment_id_idx
  on public.payroll_items (assignment_id);
create index if not exists shift_assignments_position_id_idx
  on public.shift_assignments (position_id);
create index if not exists worker_position_skills_position_id_idx
  on public.worker_position_skills (position_id);
