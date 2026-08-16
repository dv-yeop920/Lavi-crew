create or replace function public.get_admin_month_schedule_workers(
  p_month_start date,
  p_month_end date,
  p_previous_month_start date
)
returns table(
  worker_id uuid,
  worker_name text,
  applied_dates date[],
  position_ids text[],
  previous_position_ids text[]
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  return query
  select
    profile.id,
    profile.name,
    coalesce(
      (
        select array_agg(application.work_date order by application.work_date)
        from public.schedule_applications application
        where application.worker_id = profile.id
          and application.status = 'applied'
          and application.work_date >= p_month_start
          and application.work_date < p_month_end
      ),
      '{}'::date[]
    ),
    coalesce(
      (
        select array_agg(skill.position_id order by skill.position_id)
        from public.worker_position_skills skill
        where skill.worker_id = profile.id
      ),
      '{}'::text[]
    ),
    coalesce(
      (
        select array_agg(assignment.position_id order by previous_shift.work_date)
        from public.shift_assignments assignment
        join public.shifts previous_shift on previous_shift.id = assignment.shift_id
        where assignment.worker_id = profile.id
          and assignment.status = 'confirmed'
          and previous_shift.work_date >= p_previous_month_start
          and previous_shift.work_date < p_month_start
      ),
      '{}'::text[]
    )
  from public.profiles profile
  where profile.role = 'worker'
    and profile.is_active
  order by profile.name;
end;
$$;

revoke all on function public.get_admin_month_schedule_workers(date, date, date) from public, anon;
grant execute on function public.get_admin_month_schedule_workers(date, date, date) to authenticated;
