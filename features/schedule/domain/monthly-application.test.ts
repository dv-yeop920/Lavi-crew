import { describe, expect, it } from 'vitest'

import {
  getApplicationPeriodViewState,
  getEffectiveApplicationPeriodStatus,
  normalizeMonthlyApplicationDates,
} from './monthly-application'

describe('normalizeMonthlyApplicationDates', () => {
  it('sorts and deduplicates dates in the requested month', () => {
    expect(
      normalizeMonthlyApplicationDates('2026-08', ['2026-08-09', '2026-08-01', '2026-08-09']),
    ).toEqual({ dates: ['2026-08-01', '2026-08-09'], errors: [] })
  })

  it('rejects dates outside the requested month', () => {
    expect(normalizeMonthlyApplicationDates('2026-08', ['2026-09-05']).errors).toEqual([
      { code: 'INVALID_APPLICATION_DATE', date: '2026-09-05' },
    ])
  })

  it('accepts weekday dates in the requested month', () => {
    expect(normalizeMonthlyApplicationDates('2026-08', ['2026-08-03'])).toEqual({
      dates: ['2026-08-03'],
      errors: [],
    })
  })
})

describe('getEffectiveApplicationPeriodStatus', () => {
  it('treats the exact deadline and later as closed', () => {
    const deadline = '2026-08-01T00:00:00.000Z'
    expect(getEffectiveApplicationPeriodStatus('open', deadline, new Date(deadline))).toBe('closed')
    expect(
      getEffectiveApplicationPeriodStatus('open', deadline, new Date('2026-07-31T23:59:59.999Z')),
    ).toBe('open')
  })

  it('keeps a manually closed period closed before its deadline', () => {
    expect(
      getEffectiveApplicationPeriodStatus(
        'closed',
        '2026-08-01T00:00:00.000Z',
        new Date('2026-07-01T00:00:00.000Z'),
      ),
    ).toBe('closed')
  })
})

describe('getApplicationPeriodViewState', () => {
  const futureDeadline = '2026-08-01T00:00:00.000Z'
  const asOf = new Date('2026-07-01T00:00:00.000Z')

  it('distinguishes an elapsed deadline from a manual close', () => {
    expect(getApplicationPeriodViewState('open', '2026-06-30T23:59:59.999Z', false, asOf)).toEqual({
      canReopen: false,
      closedReason: 'deadline',
      status: 'closed',
    })
    expect(getApplicationPeriodViewState('closed', futureDeadline, false, asOf)).toEqual({
      canReopen: true,
      closedReason: 'manual',
      status: 'closed',
    })
  })

  it('allows reopening only a manually closed, unpublished, future period', () => {
    expect(getApplicationPeriodViewState('closed', futureDeadline, true, asOf).canReopen).toBe(
      false,
    )
    expect(getApplicationPeriodViewState('open', futureDeadline, false, asOf)).toEqual({
      canReopen: false,
      closedReason: null,
      status: 'open',
    })
  })
})
