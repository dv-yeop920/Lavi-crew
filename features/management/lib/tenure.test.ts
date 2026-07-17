import { describe, expect, it } from 'vitest'

import { formatJoinedAt, formatTenure, getTenure } from './tenure'

describe('worker tenure', () => {
  it('formats tenure in calendar years, months, and days', () => {
    expect(formatTenure('2022-03-15', new Date('2026-07-17T12:00:00+09:00'))).toBe('4년 4개월 2일')
  })

  it('uses the end of February as the anniversary for a leap-day signup', () => {
    expect(getTenure('2024-02-29', new Date('2025-02-28T23:59:59+09:00'))).toEqual({
      days: 0,
      months: 0,
      years: 1,
    })
  })

  it('calculates the remaining days after a month-end anchor', () => {
    expect(getTenure('2026-01-31', new Date('2026-03-01T12:00:00+09:00'))).toEqual({
      days: 1,
      months: 1,
      years: 0,
    })
  })

  it('starts at zero and does not return a negative tenure', () => {
    expect(formatTenure('2026-07-17', new Date('2026-07-17T12:00:00+09:00'))).toBe('0년 0개월 0일')
    expect(formatTenure('2026-07-18', new Date('2026-07-17T12:00:00+09:00'))).toBe('0년 0개월 0일')
  })

  it('formats the signup date for Korean UI', () => {
    expect(formatJoinedAt('2024-08-10')).toBe('2024.08.10')
  })
})
