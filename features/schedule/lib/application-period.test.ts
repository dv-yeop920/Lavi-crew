import { describe, expect, it } from 'vitest'

import { canPublishMonthlySchedule, getStoredApplicationDeadline } from './application-period'

const period = {
  applicationDeadline: '2026-07-31T09:00:00.000Z',
  canReopen: false,
  closedReason: 'deadline' as const,
  id: 'c6b46977-df58-4a86-a888-d84842a52ec8',
  status: 'closed' as const,
  updatedAt: '2026-07-31T09:00:00.000Z',
}

describe('registration application period contract', () => {
  it('passes the stored deadline through as Asia/Seoul date and time values', () => {
    expect(getStoredApplicationDeadline(period.applicationDeadline)).toEqual({
      date: '2026-07-31',
      time: '18:00',
    })
  })

  it('publishes only after a complete period is effectively closed', () => {
    expect(canPublishMonthlySchedule(period)).toBe(true)
    expect(canPublishMonthlySchedule({ ...period, status: 'open' })).toBe(false)
    expect(canPublishMonthlySchedule({ ...period, applicationDeadline: null })).toBe(false)
  })
})
