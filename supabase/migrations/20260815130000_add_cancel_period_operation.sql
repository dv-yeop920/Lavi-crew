-- Add 'cancel_period' to the allowed operation values in
-- schedule_application_mutation_requests check constraint.

alter table private.schedule_application_mutation_requests
  drop constraint schedule_application_mutation_requests_operation_check;

alter table private.schedule_application_mutation_requests
  add constraint schedule_application_mutation_requests_operation_check
  check (operation in ('save_period', 'set_period_status', 'save_applications', 'cancel_period'));
