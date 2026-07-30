-- A monthly application period becomes immutable once any schedule has been
-- Remote migration version: 20260730125925.
-- created from it. This covers published and later-cancelled schedule history
-- and closes the automatic-deadline path where status can remain `open`.
create function private.prevent_published_period_reopen()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.shifts
    where application_period_id = old.id
  ) and (
    new.application_deadline is distinct from old.application_deadline
    or (old.status = 'closed' and new.status = 'open')
  ) then
    raise exception 'PERIOD_HAS_SCHEDULE_HISTORY';
  end if;

  return new;
end;
$$;

revoke all on function private.prevent_published_period_reopen() from public, anon, authenticated;

create trigger prevent_published_period_reopen
before update of application_deadline, status
on public.schedule_application_periods
for each row
execute function private.prevent_published_period_reopen();
