import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  new URL(
    '../../../../supabase/migrations/20260730121847_date_based_monthly_applications.sql',
    import.meta.url,
  ),
  'utf8',
)
const publishWrapper = migration.slice(
  migration.indexOf('create function public.save_monthly_schedule_registration('),
)
const immutablePeriodMigration = readFileSync(
  new URL(
    '../../../../supabase/migrations/20260730125925_prevent_published_period_reopen.sql',
    import.meta.url,
  ),
  'utf8',
)
const openPeriodRegistrationMigration = readFileSync(
  new URL(
    '../../../../supabase/migrations/20260817183139_allow_open_period_schedule_registration.sql',
    import.meta.url,
  ),
  'utf8',
)

describe('date-based monthly application migration contract', () => {
  it('prevents deadline changes and reopening after any schedule history exists', () => {
    expect(immutablePeriodMigration).toContain('where application_period_id = old.id')
    expect(immutablePeriodMigration).toContain(
      'new.application_deadline is distinct from old.application_deadline',
    )
    expect(immutablePeriodMigration).toContain("(old.status = 'closed' and new.status = 'open')")
    expect(immutablePeriodMigration).toContain("raise exception 'PERIOD_HAS_SCHEDULE_HISTORY'")
  })

  it('locks and version-checks the existing period before publishing', () => {
    expect(publishWrapper).toContain('where year_month = p_year_month\n   for update;')
    expect(publishWrapper).toContain('period_record.updated_at <> p_expected_period_updated_at')
    expect(publishWrapper).toContain("raise exception 'STALE_PERIOD'")
  })

  it('preserves completed request replay before rejecting the touched period version', () => {
    const replayCheck = publishWrapper.indexOf('from private.schedule_registration_requests')
    const staleCheck = publishWrapper.indexOf(
      'period_record.updated_at <> p_expected_period_updated_at',
    )
    expect(replayCheck).toBeGreaterThan(-1)
    expect(replayCheck).toBeLessThan(staleCheck)
  })

  it('allows an administrator to publish while the application period is open', () => {
    expect(openPeriodRegistrationMigration).toContain(
      'create or replace function public.save_monthly_schedule_registration(',
    )
    expect(openPeriodRegistrationMigration).not.toContain(
      "raise exception 'APPLICATION_PERIOD_OPEN'",
    )
    expect(openPeriodRegistrationMigration).toContain("raise exception 'FORBIDDEN'")
    expect(openPeriodRegistrationMigration).toContain("raise exception 'WORKER_NOT_APPLIED'")
  })

  it('rejects a deadline mismatch and passes only the stored deadline to legacy publishing', () => {
    expect(publishWrapper).toContain('p_application_deadline <> period_record.application_deadline')
    expect(publishWrapper).toContain("raise exception 'PERIOD_DEADLINE_MISMATCH'")
    expect(publishWrapper).toContain(
      'p_request_id, p_year_month, period_record.application_deadline,',
    )
  })

  it('removes every historical direct-write policy for applications', () => {
    expect(migration).toContain(
      'drop policy if exists "workers or admin insert applications" on public.schedule_applications;',
    )
    expect(migration).toContain(
      'drop policy if exists "admin updates applications" on public.schedule_applications;',
    )
    expect(migration).toContain(
      'revoke insert, update, delete on public.schedule_applications from anon, authenticated;',
    )
  })
})
