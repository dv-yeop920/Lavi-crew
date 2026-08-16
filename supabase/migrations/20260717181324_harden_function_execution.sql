-- Remove Postgres's default PUBLIC EXECUTE privilege from SECURITY DEFINER RPCs.
revoke execute on all functions in schema public from public;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.close_application_period(uuid) to authenticated;
grant execute on function public.confirm_attendance_and_payroll(uuid, public.attendance_status, text) to authenticated;
grant execute on function public.complete_worker_onboarding(text, text, text) to authenticated;
