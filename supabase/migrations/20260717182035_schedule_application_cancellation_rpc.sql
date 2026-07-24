-- Workers can only cancel their own pending application through this narrow RPC.
-- The previous direct UPDATE policy allowed unrelated column/state transitions.
drop policy if exists "workers cancel own while open" on public.schedule_applications;

create or replace function public.cancel_own_schedule_application(application_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  update public.schedule_applications application
  set status = 'cancelled', cancelled_at = now()
  where application.id = application_id
    and application.worker_id = auth.uid()
    and application.status = 'applied'
    and exists (
      select 1 from public.shifts shift
      join public.schedule_application_periods period on period.id = shift.application_period_id
      where shift.id = application.shift_id and period.status = 'open' and period.application_deadline > now()
    );
  if not found then raise exception 'APPLICATION_CANNOT_BE_CANCELLED'; end if;
end; $$;

revoke execute on function public.cancel_own_schedule_application(uuid) from public, anon;
grant execute on function public.cancel_own_schedule_application(uuid) to authenticated;
