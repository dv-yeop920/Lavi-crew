drop policy if exists "applications read own or admin" on public.schedule_applications;

create policy "applications read own or admin"
on public.schedule_applications
for select
to authenticated
using (
  (
    worker_id = (select auth.uid())
    and (select private.is_active_user())
  )
  or (select private.is_admin())
);
