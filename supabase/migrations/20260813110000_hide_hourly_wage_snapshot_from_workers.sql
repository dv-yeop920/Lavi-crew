-- Fix: authenticated users could read hourly_wage_snapshot on other workers'
-- assignments via the broadened shift_assignments RLS. Replace table-level
-- SELECT with column-level grants that exclude hourly_wage_snapshot.
-- Security-definer RPCs (payroll creation) run as the function owner and
-- are unaffected by this change.

REVOKE SELECT ON public.shift_assignments FROM authenticated;

GRANT SELECT (
  id,
  shift_id,
  worker_id,
  position_id,
  slot_index,
  is_training,
  status,
  assigned_by,
  confirmed_at,
  cancelled_at,
  cancelled_by,
  created_at,
  updated_at
) ON public.shift_assignments TO authenticated;
