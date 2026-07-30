# 011. Notice mutations and the real admin dashboard

## RADIO

- **Requirements:** active workers see published notices pinned-first, can mark a notice read when
  its content opens, and see their own read state. Admins manage active published notices and see
  the read count among currently active workers. The dashboard summarizes published schedules for
  the current KST Monday-Sunday week, the current month's application-period state, and the number
  of weekend dates without a published schedule. Empty results are valid; query failures are not
  replaced by fixtures.
- **Architecture:** Server Actions validate Zod payloads and revalidate notice, home, and admin
  routes. Controllers repeat role authorization and produce ViewModels. Repositories contain
  least-field Supabase calls. Notice changes and reads go through atomic RPCs; the dashboard is
  read-only. The worker home keeps its existing feature-local preview query to avoid a
  cross-feature dependency while sharing the same RLS-backed notice contract.
- **Data:** notice delete is a soft state transition that records both `deleted_at` and
  `deleted_by`. Update and delete require `expected_updated_at`. A private request table stores
  actor, operation, payload hash, target, and stable result for retry-safe mutations. Read counts
  deduplicate readers and exclude inactive workers. Dashboard dates are calendar dates in
  `Asia/Seoul`; only published shifts count as registered.
- **Interfaces:** create, update, delete, and mark-read accept a caller-generated UUID request ID.
  Update/delete accept the current notice version. RPC errors expose stable machine codes such as
  `STALE_NOTICE`, `NOTICE_NOT_FOUND`, and `IDEMPOTENCY_KEY_REUSED`; Actions map them to user-safe
  messages. Mutation results return the notice ID plus the new version or deletion/read timestamp
  so clients can reconcile optimistic state.
- **Optimization and observability:** notice queries select only rendered fields and sort in a
  deterministic pure model. Dashboard reads run concurrently and use existing status/date indexes.
  No client JavaScript or hydration is added by this server slice. Targeted tests cover validation,
  sorting, active-worker read counts, KST bounds, effective period state, weekend gaps, and static
  migration security/idempotency invariants.

## Security and recovery

Workers can select only published notices and their own read rows; admins can select all notice
states and read rows. Direct authenticated writes to `notices` and `notice_reads` are revoked.
Each `SECURITY DEFINER` RPC fixes an empty search path and repeats active-role authorization.
Conflicting retries fail without changing the original result, and stale update/delete requests
require a refresh rather than overwriting newer content.
