import { describe, expect, it } from 'vitest'

import { getLeadingBlankCount, isWeekend } from './calendar'

describe('schedule application calendar', () => {
  it('starts July 2026 after three leading blank cells', () => {
    expect(getLeadingBlankCount(2026, 6)).toBe(3)
  })

  it('allows only Saturday and Sunday', () => {
    expect(isWeekend(2026, 6, 4)).toBe(true)
    expect(isWeekend(2026, 6, 5)).toBe(true)
    expect(isWeekend(2026, 6, 6)).toBe(false)
  })
})
