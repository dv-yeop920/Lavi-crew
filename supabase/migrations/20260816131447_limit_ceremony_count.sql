alter table public.shifts
  drop constraint if exists shifts_ceremony_count_check,
  add constraint shifts_ceremony_count_check check (ceremony_count between 1 and 10);
