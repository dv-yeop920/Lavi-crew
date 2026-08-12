# 010. Worker schedule, payroll, and home read models

## RADIO

- **Requirements:** workers see only their confirmed published schedules, confirmed
  attendance-based pay, current application summary, next shift, and published notice previews.
  URL date/month inputs have explicit invalid states and empty arrays are valid results.
- **Architecture:** Server Components consume Controller ViewModels. Controllers derive the
  authenticated worker ID and date ranges; repositories issue least-field Supabase reads under
  RLS. No client-provided worker ID is accepted and no mutation is introduced.
- **Data:** schedule rows require a confirmed assignment and published shift. Payroll details
  require a non-voided item, present attendance with actual timestamps, and confirmed assignment.
  Selected-month details and totals stay inside that calendar month. Weekly totals query the
  complete Monday-Sunday weeks that overlap the selected month in Asia/Seoul, including
  cross-month days. Average pay is recalculated from valid active details and includes only
  months containing at least one such item.
- **Interfaces:** schedule uses `{ mode: month|week|day, anchor: YYYY-MM-DD }`; payroll uses
  `{ month: YYYY-MM }`. Home uses the current authenticated profile and current time. ViewModels
  expose ready/invalid states and empty collections without raw database records.
- **Optimization and observability:** reads select only rendered fields and use existing
  worker/status/date and foreign-key indexes. No speculative index migration is added. Supabase
  failures map to feature-safe server errors without logging personal or payroll data.

## Database read boundary

Workers may read all published shifts, all confirmed assignments on those shifts, and all
profiles. This allows the "전체 일정 조회" view to display the full roster (every position and
assigned worker name) identically to the admin schedule history view. Prior to migration
`20260812100736_allow_worker_full_schedule_reads`, workers could only read shifts where they held
a confirmed assignment and only their own profile row; that restriction was relaxed because the
team schedule is shared operational information in a small wedding-hall crew.

Admins retain full visibility including cancelled shifts and non-confirmed assignments.
Attendance status enforces actual-time invariants. Legacy `present` rows without actual times
are reset to pending only when they have no active payroll item; an active payroll conflict
blocks migration for manual review.
