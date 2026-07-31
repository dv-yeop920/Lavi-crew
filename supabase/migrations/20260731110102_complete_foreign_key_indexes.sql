create index if not exists invite_mutation_requests_target_id_idx
  on private.invite_mutation_requests (target_id);

create index if not exists payroll_items_payroll_id_idx
  on public.payroll_items (payroll_id);
