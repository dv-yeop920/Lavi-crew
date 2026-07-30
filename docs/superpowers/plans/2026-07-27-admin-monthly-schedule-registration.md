# Admin Monthly Schedule Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 관리자 월별 일정 등록 fixtures with authenticated Supabase reads and one atomic, idempotent monthly registration RPC that immediately publishes shifts, confirms assignments, creates pending attendance, and queues notification logs.

**Architecture:** Keep the existing VAC flow: Server Component/View → Server Action → Controller → pure Domain and Supabase Repository → PostgreSQL RPC. Server reads build a minimal month-registration view model; the Client Component owns only unsaved draft state. PostgreSQL is the final authorization and transaction boundary.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Zod 4, vanilla-extract, Supabase SSR/PostgREST/PostgreSQL/RLS, Vitest.

---

## File map

- `supabase/migrations/<generated>_save_monthly_schedule_registration.sql`: schema changes, indexes, grants/RLS changes, idempotency table, and atomic RPC.
- `shared/supabase/database.types.ts`: generated database contract after the migration.
- `features/schedule/domain/schedule-registration.ts`: fixed capacity, slot, date, and duplicate-worker rules.
- `features/schedule/domain/schedule-registration.test.ts`: pure boundary tests.
- `features/schedule/schemas/schedule-registration-input.ts`: untrusted Server Action input parsing.
- `features/schedule/schemas/schedule-registration-input.test.ts`: Zod validation tests.
- `features/schedule/repositories/schedule-registration-repository.ts`: month view-model queries and RPC call only.
- `features/schedule/controllers/schedule-registration-controller.ts`: admin authorization, KST conversion, orchestration, and safe error mapping.
- `features/schedule/actions/schedule-registration-actions.ts`: Zod boundary, controller call, and path revalidation.
- `features/schedule/components/schedule-assignment-table.tsx`: fixture-free assignment editor with base/training slots.
- `features/schedule/views/admin-schedule-registration-view.tsx`: draft form, confirmation, error recovery, and success UI.
- `features/schedule/views/admin-schedule-view.tsx`: registered schedule summaries from persisted data.
- `app/admin/schedules/page.tsx`: server-loaded month summaries.
- `app/admin/schedules/new/page.tsx`: server-loaded registration view model.
- `docs/requirements-specification.html`, `docs/user-flow.html`, `docs/screen-architecture.html`, `docs/supabase-erd.html`, `docs/architecture.md`, `docs/decisions/005-supabase-boundaries.md`: persisted contract and UI-flow synchronization.

### Task 1: Pure registration rules and input contract

- [ ] Add failing Vitest cases for manager/guide base capacity 2, other positions base capacity 1, exactly one training-only extra slot, all eight positions, weekend/month matching, valid time range, and a worker appearing only once per date.
- [ ] Run `npm test -- features/schedule/domain/schedule-registration.test.ts features/schedule/schemas/schedule-registration-input.test.ts` and confirm failure because the modules do not exist.
- [ ] Implement discriminated slot types and deterministic validators in `features/schedule/domain/schedule-registration.ts`.
- [ ] Implement `publishMonthlySchedulesInputSchema` in `features/schedule/schemas/schedule-registration-input.ts`; reject unknown/invalid input and expose stable field paths.
- [ ] Re-run the focused tests and confirm all boundary cases pass.

### Task 2: PostgreSQL persistence and security boundary

- [ ] Run `npx supabase migration new save_monthly_schedule_registration` and use the generated filename.
- [ ] Add `shift_assignments.slot_index`, the active slot uniqueness constraint, `notification_logs.correlation_id`, the private idempotency request table, and supporting indexes.
- [ ] Add `public.save_monthly_schedule_registration(uuid,date,timestamptz,timestamptz,jsonb) returns jsonb` with `SECURITY DEFINER SET search_path = ''`.
- [ ] Inside the RPC, verify `auth.uid()` is an active admin; lock the month period; verify payload hash/idempotency, month/weekend/time/capacity/worker/wage rules; create or update the period; insert published shifts and confirmed assignments; rely on the existing assignment trigger for pending attendance; insert pending notification rows only for consenting recipients; and return counts.
- [ ] Revoke `PUBLIC`/`anon`, grant only `authenticated`, and remove direct admin write policies/grants for period/shift/assignment/notification tables while retaining required reads and worker application operations.
- [ ] Verify representative admin success, anon/worker denial, duplicate request replay, reused-key conflict, capacity rejection, and transaction rollback in SQL or an isolated database test.
- [ ] Run security and performance advisors, fix new actionable findings, and regenerate `shared/supabase/database.types.ts`.

### Task 3: VAC server integration

- [ ] Add failing repository/controller contract tests for month reads, RPC argument mapping, stale-period errors, forbidden access, and safe error messages.
- [ ] Implement the repository to select only the period, registered shifts, positions, active profiles, skills, applications, and previous-month confirmed attendance needed by the view model.
- [ ] Implement the controller with active-admin authorization, KST deadline conversion, domain validation, and a whitelist mapping from database error codes to `FormActionResult`.
- [ ] Implement the Server Action with `safeParse`, preserved submitted values, controller invocation, `revalidatePath('/admin/schedules')`, `revalidatePath('/admin/schedules/new')`, and generated daily paths.
- [ ] Run focused tests and `npm run check:architecture`.

### Task 4: Server-loaded schedule pages and functional registration form

- [ ] Replace fixture imports in the two admin schedule pages with controller/repository reads.
- [ ] Pass the month period, persisted schedules, unregistered weekend dates, and active worker options into the registration view.
- [ ] Refactor `ScheduleAssignmentTable` so base slots cannot be removed, one extra slot is training-only and removable, duplicate workers are disabled for the date, and every control has a date/position/slot accessible label.
- [ ] Wire the form to the Server Action with one stable request ID per submission attempt, pending-state duplicate protection, confirmation counts, field/error summary, input preservation, stale refresh, and truthful success text.
- [ ] Keep the layout mobile-first with no page-level horizontal overflow at 34rem or below and minimum 44px destructive/additional-slot targets.
- [ ] Add component/interaction tests where supported and run the schedule test suite.

### Task 5: Documentation and legacy cleanup

- [ ] Update requirements, user flow, screen architecture, ERD, architecture, and ADR 005 with the immediate published/confirmed state, capacity-plus-training-extra rule, pending notification log behavior, idempotency store, slot index, and RPC-only write boundary.
- [ ] Remove schedule-registration fixtures and obsolete local-only save/deadline state that no longer have a consumer.
- [ ] Run `rg` to confirm the admin registration path no longer imports `schedule-fixtures` or `scheduleWorkers`.
- [ ] Run `npm run check:harness` and `git diff --check`.

### Task 6: End-to-end verification and review

- [ ] Run `npm run format`, then `npm run format:check`, `npm run lint`, `npm run check:architecture`, `npm run check:harness`, `npm test`, and `npm run build`.
- [ ] Start the app, sign in as an administrator, load a month from Supabase, register a valid weekend schedule, verify it appears on the schedule list/detail and in database rows, and confirm validation errors preserve the draft.
- [ ] Check narrow mobile viewport, keyboard focus, error announcement, no console/hydration errors, and no duplicate request on rapid submit.
- [ ] Have an independent reviewer compare the final diff to the design specification, then fix and re-run affected checks for every accepted finding.
