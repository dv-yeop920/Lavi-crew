import { describe, expect, it } from 'vitest'

import { canRegisterMonthlySchedule, getStoredApplicationDeadline } from './application-period'

const period = {
  applicationDates: ['2026-08-01'],
  applicationDeadline: '2026-07-31T09:00:00.000Z',
  canReopen: false,
  closedReason: null,
  id: 'c6b46977-df58-4a86-a888-d84842a52ec8',
  status: 'open' as const,
  updatedAt: '2026-07-31T09:00:00.000Z',
}

describe('registration application period contract', () => {
  it('passes the stored deadline through as Asia/Seoul date and time values', () => {
    expect(getStoredApplicationDeadline('2026-07-31T09:00:00.000Z')).toEqual({
      date: '2026-07-31',
      time: '18:00',
    })
  })

  it('allows registration for both open and closed periods with complete metadata', () => {
    expect(canRegisterMonthlySchedule(period)).toBe(true)
    expect(canRegisterMonthlySchedule({ ...period, status: 'closed' })).toBe(true)
    expect(canRegisterMonthlySchedule({ ...period, id: null })).toBe(false)
    expect(canRegisterMonthlySchedule({ ...period, applicationDeadline: null })).toBe(false)
  })
})
