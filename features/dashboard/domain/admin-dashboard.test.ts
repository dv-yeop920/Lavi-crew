import { describe, expect, it } from 'vitest'

import {
  countUnregisteredWeekendDates,
  getEffectiveApplicationPeriodStatus,
  getKstDashboardDateRange,
} from './admin-dashboard'

describe('admin dashboard date models', () => {
  it('uses the KST Monday week even around UTC midnight', () => {
    expect(getKstDashboardDateRange(new Date('2026-07-26T16:00:00Z'))).toEqual({
      monthEndExclusive: '2026-08-01',
      monthStart: '2026-07-01',
      nextMonthEndExclusive: '2026-09-01',
      nextMonthStart: '2026-08-01',
      today: '2026-07-27',
      weekEndExclusive: '2026-08-03',
      weekStart: '2026-07-27',
    })
  })

  it('rolls the next month range over into the following year in December', () => {
    expect(getKstDashboardDateRange(new Date('2026-12-15T00:00:00Z'))).toMatchObject({
      monthStart: '2026-12-01',
      nextMonthEndExclusive: '2027-02-01',
      nextMonthStart: '2027-01-01',
    })
  })

  it('counts only weekends without a published schedule', () => {
    expect(
      countUnregisteredWeekendDates('2026-08-01', '2026-09-01', [
        '2026-08-01',
        '2026-08-02',
        '2026-08-08',
      ]),
    ).toBe(7)
  })

  it('treats an expired open period as effectively closed', () => {
    expect(
      getEffectiveApplicationPeriodStatus(
        'open',
        '2026-07-30T00:00:00Z',
        new Date('2026-07-30T00:00:01Z'),
      ),
    ).toBe('effectively_closed')
  })
})
