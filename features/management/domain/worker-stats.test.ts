import { describe, expect, it } from 'vitest'

import {
  calculateAverageMonthlyApplicationDays,
  getPreviousMonthRange,
  summarizePreviousMonthAttendance,
} from './worker-stats'

describe('worker presentation and statistics', () => {
  it('averages unique applied work days by active application month', () => {
    expect(
      calculateAverageMonthlyApplicationDays([
        { status: 'applied', workDate: '2026-06-07' },
        { status: 'applied', workDate: '2026-06-07' },
        { status: 'cancelled', workDate: '2026-06-14' },
        { status: 'applied', workDate: '2026-07-05' },
        { status: 'applied', workDate: '2026-07-12' },
      ]),
    ).toBe(1.5)
  })

  it('counts only present attendance inside the previous calendar month', () => {
    const range = getPreviousMonthRange(new Date('2026-07-24T00:00:00Z'))
    expect(range).toEqual({ end: '2026-07-01', start: '2026-06-01' })
    expect(
      summarizePreviousMonthAttendance(
        [
          { positionId: 'main', status: 'present', workDate: '2026-06-07' },
          { positionId: 'main', status: 'absent', workDate: '2026-06-14' },
          { positionId: 'scan', status: 'present', workDate: '2026-06-21' },
          { positionId: 'scan', status: 'present', workDate: '2026-07-05' },
        ],
        range,
        [
          { id: 'scan', name: '스캔' },
          { id: 'main', name: '메인' },
        ],
      ),
    ).toEqual({
      attendanceCount: 2,
      positionCounts: [
        { count: 1, name: '스캔' },
        { count: 1, name: '메인' },
      ],
    })
  })

  it('uses the Asia/Seoul month at the UTC month boundary', () => {
    expect(getPreviousMonthRange(new Date('2026-07-31T15:30:00Z'))).toEqual({
      end: '2026-08-01',
      start: '2026-07-01',
    })
  })
})
