import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  new URL(
    '../../../supabase/migrations/20260730121911_daily_schedule_and_attendance_mutations.sql',
    import.meta.url,
  ),
  'utf8',
)
const attendanceLegacy = readFileSync(
  new URL(
    '../../../supabase/migrations/20260724111735_harden_worker_skills_and_attendance.sql',
    import.meta.url,
  ),
  'utf8',
)

describe('daily schedule migration contract', () => {
  it('records cancellation actors and reasons without deleting history', () => {
    expect(migration).toContain('add column cancellation_reason text')
    expect(migration).toContain('add column cancelled_by uuid')
    expect(migration).not.toMatch(/delete\s+from\s+public\.(shifts|shift_assignments)/i)
  })

  it('preserves exact assignments and cancels only removed or replaced rows', () => {
    expect(migration).toContain('and not exists (')
    expect(migration).toContain("set status = 'cancelled', cancelled_at = now()")
    expect(migration).toContain("status = 'confirmed'")
  })

  it('retains the existing nine-hour and 1.5x payroll formula', () => {
    expect(attendanceLegacy).toContain('regular_minutes := least(worked_minutes, 540)')
    expect(attendanceLegacy).toContain('overtime_minutes := greatest(worked_minutes - 540, 0)')
    expect(attendanceLegacy).toContain('overtime_minutes * assignment.hourly_wage_snapshot * 1.5')
  })
})
