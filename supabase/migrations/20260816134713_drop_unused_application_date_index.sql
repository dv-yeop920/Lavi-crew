-- The composite primary key already covers all application-period date reads.
drop index if exists public.schedule_application_dates_work_date_idx;
