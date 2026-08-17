import { describe, expect, it } from 'vitest'

import {
  monthlyApplicationSchema,
  scheduleApplicationPeriodSchema,
  scheduleApplicationPeriodStatusSchema,
} from './monthly-application'

const requestId = 'e2308f73-a094-4dd1-8505-e216d5c4fc68'

describe('monthly application schemas', () => {
  it('accepts an empty full-month selection so every date can be cancelled atomically', () => {
    expect(
      monthlyApplicationSchema.safeParse({
        expectedPeriodUpdatedAt: '2026-07-29T00:00:00.000Z',
        month: '2026-08',
        periodId: requestId,
        requestId,
        selectedDates: [],
      }).success,
    ).toBe(true)
  })

  it('requires an optimistic-concurrency version for an existing period', () => {
    expect(
      scheduleApplicationPeriodSchema.safeParse({
        applicationDates: ['2026-08-01'],
        applicationDeadline: '2026-08-01T09:00:00+09:00',
        expectedPeriodUpdatedAt: null,
        month: '2026-08',
        periodId: requestId,
        requestId,
      }).success,
    ).toBe(false)
  })

  it('requires the administrator to select at least one application date', () => {
    expect(
      scheduleApplicationPeriodSchema.safeParse({
        applicationDates: [],
        applicationDeadline: '2026-08-01T09:00:00+09:00',
        expectedPeriodUpdatedAt: null,
        month: '2026-08',
        periodId: null,
        requestId,
      }).success,
    ).toBe(false)
  })

  it('allows only explicit open and closed transitions', () => {
    expect(
      scheduleApplicationPeriodStatusSchema.safeParse({
        expectedPeriodUpdatedAt: '2026-07-29T00:00:00.000Z',
        nextStatus: 'published',
        periodId: requestId,
        requestId,
      }).success,
    ).toBe(false)
  })
})
