import { describe, expect, it } from 'vitest'

import { getWorkerScheduleRange, isExactDate } from './worker-read-models'

describe('worker schedule ranges', () => {
  it('builds Monday-Sunday ranges without crossing on Sunday incorrectly', () => {
    expect(getWorkerScheduleRange('week', '2026-08-02')).toEqual({
      end: '2026-08-02',
      start: '2026-07-27',
    })
    expect(getWorkerScheduleRange('week', '2026-08-03')).toEqual({
      end: '2026-08-09',
      start: '2026-08-03',
    })
  })

  it('validates real calendar dates and month/day ranges', () => {
    expect(isExactDate('2026-02-29')).toBe(false)
    expect(getWorkerScheduleRange('month', '2026-08-15')).toEqual({
      end: '2026-08-31',
      start: '2026-08-01',
    })
    expect(getWorkerScheduleRange('day', '2026-08-15')).toEqual({
      end: '2026-08-15',
      start: '2026-08-15',
    })
  })
})
