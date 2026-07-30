import { describe, expect, it } from 'vitest'

import { getCanonicalMonth } from './month-query'

describe('getCanonicalMonth', () => {
  it('keeps a valid month and rejects missing or invalid values', () => {
    expect(getCanonicalMonth('2026-08')).toBe('2026-08')
    expect(getCanonicalMonth(undefined)).toBeNull()
    expect(getCanonicalMonth('2026-13')).toBeNull()
    expect(getCanonicalMonth('not-a-month')).toBeNull()
  })
})
