import { describe, expect, it } from 'vitest'

import { formatFullWeekLabel } from './payroll-display'

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
})
