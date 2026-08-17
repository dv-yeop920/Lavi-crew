import { describe, expect, it } from 'vitest'

import { movePayrollMonth } from './payroll-navigation'

describe('movePayrollMonth', () => {
  it('moves across year boundaries', () => {
    expect(movePayrollMonth('2026-01', -1)).toBe('2025-12')
    expect(movePayrollMonth('2026-12', 1)).toBe('2027-01')
  })
})
