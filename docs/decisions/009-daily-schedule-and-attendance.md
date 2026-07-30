# 009. Daily schedule maintenance and attendance

## RADIO

- **Requirements:** admins read one real schedule by date, edit its complete assignment set,
  cancel with a reason, and confirm or correct attendance. Invalid and missing dates are
  distinct. Any confirmed attendance freezes structural schedule changes.
- **Architecture:** the daily View consumes one server ViewModel. Zod Actions call
  role-checking Controllers, repositories call atomic RPCs, and Postgres remains the
  authorization and concurrency boundary.
- **Data:** unchanged confirmed assignments retain their IDs and wage snapshots. Replaced or
  removed assignments transition to `cancelled`; new assignments become `confirmed` and the
  existing trigger creates pending attendance. Shift and assignment cancellation retain actor,
  timestamp, and reason audit data.
- **Interfaces:** `update_daily_schedule`, `cancel_daily_schedule`, and the safe
  `confirm_attendance_and_payroll` accept a request ID and expected row version. Stable errors
  cover invalid, missing, stale, forbidden, already-confirmed attendance, and idempotency
  conflicts.
- **Optimization and observability:** mutations lock only the target shift structure. Request
  logs contain operation, target, actor, payload hash, result, and timestamps. Changed or
  cancelled workers receive pending notification rows correlated by request ID.

## Access matrix

| Operation | Anonymous | Worker | Active admin | Private owner |
| --- | --- | --- | --- | --- |
| Daily schedule read | Denied | Published own-visible data | Full detail | Allowed |
| Structural update/cancel | Denied | Denied | RPC only | Allowed |
| Attendance/payroll confirmation | Denied | Denied | RPC only | Allowed |
| Mutation request logs | Denied | Denied | Denied | Allowed |

Apply `20260730121911_daily_schedule_and_attendance_mutations.sql` after the date-based
application migration. It is intentionally forward-only; rollback requires another migration
that preserves audit, attendance, and payroll history.
