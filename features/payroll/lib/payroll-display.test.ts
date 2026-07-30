import { describe, expect, it } from 'vitest'

import { formatActualPayrollTime, formatFullWeekLabel } from './payroll-display'

describe('payroll display', () => {
  it('labels a complete Monday-Sunday week across a month boundary', () => {
    expect(
      formatFullWeekLabel({
        coverage: 'full-week',
        end: '2026-08-02',
        start: '2026-07-27',
      }),
    ).toBe('7월 27일 (월)–8월 2일 (일)')
  })

  it('formats actual timestamps in Korea and rejects unusable values', () => {
    expect(formatActualPayrollTime('2026-08-01T00:30:00Z')).toBe('09:30')
    expect(formatActualPayrollTime('not-a-timestamp')).toBeNull()
    expect(formatActualPayrollTime(null)).toBeNull()
  })
})
