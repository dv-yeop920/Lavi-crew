import { describe, expect, it } from 'vitest'

import {
  calculatePaidMonthAverage,
  getMonthCoveringWeekRange,
  groupPayrollDetailsByWeek,
} from './payroll-read-models'

describe('payroll read models', () => {
  it('groups Sunday and the following Monday into different Monday-Sunday weeks', () => {
    expect(
      groupPayrollDetailsByWeek([
        { amount: 10, workDate: '2026-08-02', workedMinutes: 60 },
        { amount: 20, workDate: '2026-08-03', workedMinutes: 120 },
      ]),
    ).toEqual([
      {
        amount: 10,
        end: '2026-08-02',
        shiftCount: 1,
        start: '2026-07-27',
        workedMinutes: 60,
      },
      {
        amount: 20,
        end: '2026-08-09',
        shiftCount: 1,
        start: '2026-08-03',
        workedMinutes: 120,
      },
    ])
  })

  it('averages only months with active payroll details', () => {
    expect(
      calculatePaidMonthAverage([
        { activeItemCount: 1, totalAmount: 100_000 },
        { activeItemCount: 0, totalAmount: 900_000 },
        { activeItemCount: 2, totalAmount: 200_001 },
      ]),
    ).toBe(150_001)
    expect(calculatePaidMonthAverage([{ activeItemCount: 0, totalAmount: 10_000 }])).toBe(0)
  })

  it('expands a month to the complete Monday-Sunday boundary weeks', () => {
    expect(getMonthCoveringWeekRange('2026-08')).toEqual({
      endExclusive: '2026-09-07',
      start: '2026-07-27',
    })
  })
})
