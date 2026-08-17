import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  new URL(
    '../../../../supabase/migrations/20260730121931_harden_worker_reads_and_attendance_state.sql',
    import.meta.url,
  ),
  'utf8',
)

describe('worker read security migration', () => {
  it('limits worker assignment reads to confirmed rows on published shifts', () => {
    expect(migration).toContain('create policy "assignments read confirmed published own or admin"')
    expect(migration).toContain("status = 'confirmed'")
    expect(migration).toContain("shift.status = 'published'")
    expect(migration).toContain('worker_id = (select auth.uid())')
  })
})
