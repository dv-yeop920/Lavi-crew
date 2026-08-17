# 008. Date-based monthly worker applications

## RADIO note

### Requirements and resilience

- A worker saves the complete set of weekend dates for one month in one request.
- An open period with a future Asia/Seoul deadline is required. Empty selection cancels all
  currently applied dates.
- Reapplication updates the same logical worker/date row. Stale period versions and reused
  request IDs return stable machine-readable errors.
- Administrators create or update deadlines, close periods, and reopen only before the
  deadline and before any shift has been published for the period.

### Architecture and data flow

`View -> Server Action/Zod -> Controller/role check -> Domain date normalization ->
Repository -> SECURITY DEFINER RPC -> RLS-protected tables`.

The period row is the concurrency source of truth. The worker identity and role are always
read from the authenticated database session. Application mutations are atomic RPCs; no
client receives direct write permission.

### Data model

`schedule_applications` owns `application_period_id`, `work_date`, and `worker_id`. Their
unique constraint represents one logical application. `status` transitions between
`applied` and `cancelled`, retaining cancellation history timestamps without depending on a
published shift.

### Interfaces

- `save_schedule_application_period(request_id, month, deadline, period_id?, expected_version?)`
- `set_schedule_application_period_status(request_id, period_id, next_status, expected_version)`
- `save_own_monthly_schedule_applications(request_id, period_id, expected_version, dates[])`

All mutations return a small JSON result. Errors include `FORBIDDEN`, `INVALID_INPUT`,
`STALE_PERIOD`, `PERIOD_NOT_FOUND`, `APPLICATION_PERIOD_CLOSED`,
`PERIOD_CANNOT_BE_REOPENED`, `INVALID_APPLICATION_DATE`, and
`IDEMPOTENCY_KEY_REUSED`.

Monthly publishing is allowed while the existing period is open. The compatibility deadline
argument is read-only: it must equal the stored value, and publishing passes the stored value
to the legacy atomic implementation. Every newly published assignment must still reference a
worker whose application for that date is currently applied.

### Optimization and observability

Indexes cover period/date/status and worker/status/date reads. Request logs retain the
request actor, operation, payload hash, result, and timestamps without tokens or personal
data. The worker page model fetches only the period and the caller-visible application
rows.

## Access matrix

| Operation | Anonymous | Active worker | Active admin | Server-only/private |
| --- | --- | --- | --- | --- |
| Read periods | Denied | Allowed | Allowed | Allowed |
| Read applications | Denied | Own rows | All rows | Allowed |
| Save monthly applications | Denied | Own rows via RPC | Denied | Allowed |
| Create/update/close/reopen period | Denied | Denied | Via RPC | Allowed |
| Direct application write | Denied | Denied | Denied | Allowed |
| Read request logs | Denied | Denied | Denied | Function owner only |

## Migration and rollback

Apply `20260730121847_date_based_monthly_applications.sql` after the two
`2026072711...` migrations. It backfills through the old shift relationship and aborts if
any row cannot be mapped before removing `shift_id`. Rollback requires a new forward
migration; do not edit or revert an applied migration.
