import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260816132437_seed_demo_workers_when_opening_period.sql',
  ),
  'utf8',
)

describe('demo application seeding migration', () => {
  it('limits automatic applicants to the dedicated demo worker list', () => {
    expect(migration).toContain('create table if not exists private.demo_schedule_workers')
    expect(migration).toContain('from private.demo_schedule_workers demo')
    expect(migration).not.toContain(
      "where profile.role = 'worker'\n    and profile.is_active\n    and profile.is_demo",
    )
  })

  it('seeds only weekend applications when an application period opens', () => {
    expect(migration).toContain('extract(isodow from work_date.day) in (6, 7)')
    expect(migration).toContain('after insert or update of status, application_deadline')
  })
})
