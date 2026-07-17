import { describe, expect, it } from 'vitest'

import {
  getDaysInMonth,
  getLeadingBlankCount,
  getWeekendDateValues,
  getWeekendType,
  isWeekend,
} from './calendar'

describe('schedule application calendar', () => {
  it('starts July 2026 after three leading blank cells', () => {
    expect(getLeadingBlankCount(2026, 6)).toBe(3)
  })

  it('allows only Saturday and Sunday', () => {
    expect(isWeekend(2026, 6, 4)).toBe(true)
    expect(isWeekend(2026, 6, 5)).toBe(true)
    expect(isWeekend(2026, 6, 6)).toBe(false)
  })

  it('distinguishes Saturday and Sunday for calendar presentation', () => {
    expect(getWeekendType(2026, 6, 4)).toBe('saturday')
    expect(getWeekendType(2026, 6, 5)).toBe('sunday')
    expect(getWeekendType(2026, 6, 6)).toBeUndefined()
  })

  it('returns the correct number of days for regular and leap-year February', () => {
    expect(getDaysInMonth(2026, 1)).toBe(28)
    expect(getDaysInMonth(2028, 1)).toBe(29)
  })

  it('creates date values for every weekend in a month', () => {
    expect(getWeekendDateValues(2026, 6)).toEqual([
      '2026-07-04',
      '2026-07-05',
      '2026-07-11',
      '2026-07-12',
      '2026-07-18',
      '2026-07-19',
      '2026-07-25',
      '2026-07-26',
    ])
  })
})
