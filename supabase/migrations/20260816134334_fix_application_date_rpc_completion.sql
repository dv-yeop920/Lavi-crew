-- Correct the completion timestamp expression in the date-persistence RPCs.
-- The preceding migration created the functions before this runtime expression was exercised.

do $$
begin
  execute replace(
    pg_get_functiondef(
      'public.save_schedule_application_period_with_dates(uuid,date,timestamptz,uuid,timestamptz,date[])'::regprocedure
    ),
    'completed_at = now where',
    'completed_at = now() where'
  );
  execute replace(
    pg_get_functiondef(
      'public.save_own_monthly_schedule_applications(uuid,uuid,timestamptz,date[])'::regprocedure
    ),
    'completed_at = now where',
    'completed_at = now() where'
  );
end;
$$;
