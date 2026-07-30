import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  new URL(
    '../../../supabase/migrations/20260730121931_harden_worker_reads_and_attendance_state.sql',
    import.meta.url,
  ),
  'utf8',
)

describe('worker read security migration', () => {
  it('blocks unsafe active payroll before backfilling legacy present attendance', () => {
    expect(migration).toContain('MIGRATION_BLOCKED_PRESENT_PAYROLL_WITHOUT_ACTUAL_TIME')
    expect(migration).toContain("set status = 'pending'")
    expect(migration.indexOf('MIGRATION_BLOCKED_PRESENT_PAYROLL_WITHOUT_ACTUAL_TIME')).toBeLessThan(
      migration.indexOf("set status = 'pending'"),
    )
  })

  it('enforces status-specific actual-time and confirmation invariants', () => {
    expect(migration).toContain('add constraint attendance_status_actual_time_check')
    expect(migration).toContain("status = 'present'")
    expect(migration).toContain('actual_started_at is not null')
    expect(migration).toContain("status = 'absent'")
    expect(migration).toContain("status = 'pending'")
  })

  it('limits worker assignment reads to confirmed rows on published shifts', () => {
    expect(migration).toContain('create policy "assignments read confirmed published own or admin"')
    expect(migration).toContain("status = 'confirmed'")
    expect(migration).toContain("shift.status = 'published'")
    expect(migration).toContain('worker_id = (select auth.uid())')
  })
})
