import { describe, expect, it } from 'vitest'

import { getRegisteredSchedulesForWeek } from './schedule-week'

const schedules = [
  { date: '2026-07-12', title: 'previous Sunday' },
  { date: '2026-07-13', title: 'Monday' },
  { date: '2026-07-19', title: 'Sunday' },
  { date: '2026-07-20', title: 'next Monday' },
] as const

describe('registered schedules for week', () => {
  it('uses Monday through Sunday as the weekly range', () => {
    expect(getRegisteredSchedulesForWeek(schedules, new Date(2026, 6, 17))).toEqual([
      schedules[1],
      schedules[2],
    ])
  })

  it('keeps Sunday in the current week', () => {
    expect(getRegisteredSchedulesForWeek(schedules, new Date(2026, 6, 19))).toEqual([
      schedules[1],
      schedules[2],
    ])
  })
})
