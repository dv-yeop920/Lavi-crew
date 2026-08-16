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
      array_agg(distinct application.work_date)
        filter (where application.status = 'applied'),
      '{}'::date[]
    ),
    coalesce(
      array_agg(distinct skill.position_id)
        filter (where skill.position_id is not null),
      '{}'::text[]
    ),
    coalesce(
      array_agg(assignment.position_id)
        filter (where assignment.position_id is not null),
      '{}'::text[]
    )
  from public.profiles profile
  left join public.schedule_applications application
    on application.worker_id = profile.id
    and application.work_date >= p_month_start
    and application.work_date < p_month_end
  left join public.worker_position_skills skill
    on skill.worker_id = profile.id
  left join public.shift_assignments assignment
    on assignment.worker_id = profile.id
    and assignment.status = 'confirmed'
  left join public.shifts previous_shift
    on previous_shift.id = assignment.shift_id
    and previous_shift.work_date >= p_previous_month_start
    and previous_shift.work_date < p_month_start
  where profile.role = 'worker'
    and profile.is_active
  group by profile.id, profile.name
  order by profile.name;
end;
$$;

revoke all on function public.get_admin_month_schedule_workers(date, date, date) from public, anon;
grant execute on function public.get_admin_month_schedule_workers(date, date, date) to authenticated;
