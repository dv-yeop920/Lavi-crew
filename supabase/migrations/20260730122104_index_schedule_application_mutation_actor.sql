-- Remote migration version: 20260730122104.
create index if not exists schedule_application_mutation_requests_requested_by_idx
  on private.schedule_application_mutation_requests (requested_by);
