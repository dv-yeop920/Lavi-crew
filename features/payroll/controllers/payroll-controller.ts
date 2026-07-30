import 'server-only'

import { requireRole } from '@/shared/auth/session'

import {
  calculatePaidMonthAverage,
  getMonthCoveringWeekRange,
  groupPayrollDetailsByWeek,
} from '../domain/payroll-read-models'
import { getWorkerPayrollRecords } from '../repositories/payroll-repository'
import type { WorkerPayrollViewModel } from '../schemas/payroll-view-model'

function monthBounds(month: string) {
  const start = `${month}-01`
  const end = new Date(`${start}T00:00:00Z`)
  end.setUTCMonth(end.getUTCMonth() + 1)
  return { end: end.toISOString().slice(0, 10), start }
}

export async function getWorkerPayrollController(month: string): Promise<WorkerPayrollViewModel> {
  const profile = await requireRole('worker')
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return {
      averagePaidMonthAmount: 0,
      details: [],
      month,
      state: 'invalid',
      totalAmount: 0,
      weeks: [],
    }
  }
  const bounds = monthBounds(month)
  const weekBounds = getMonthCoveringWeekRange(month)
  const records = await getWorkerPayrollRecords({
    monthEnd: bounds.end,
    monthStart: bounds.start,
    weekEnd: weekBounds.endExclusive,
    weekStart: weekBounds.start,
    workerId: profile.id,
  })
  const safeDetails = records.details.filter(
    (detail) =>
      detail.attendance_records.actual_started_at !== null &&
      detail.attendance_records.actual_ended_at !== null,
  )
  const details = safeDetails.map((detail) => ({
    actualEndedAt: detail.attendance_records.actual_ended_at as string,
    actualStartedAt: detail.attendance_records.actual_started_at as string,
    amount: detail.amount,
    id: detail.id,
    overtimeMinutes: detail.overtime_minutes,
    positionName: detail.shift_assignments.positions.name,
    regularMinutes: detail.regular_minutes,
    shiftId: detail.shift_assignments.shifts.id,
    workDate: detail.shift_assignments.shifts.work_date,
  }))
  const paidMonthTotals = new Map<string, { activeItemCount: number; totalAmount: number }>()
  records.paidItems.forEach((item) => {
    if (
      item.attendance_records.actual_started_at === null ||
      item.attendance_records.actual_ended_at === null
    )
      return
    const monthKey = item.monthly_payrolls.year_month
    const current = paidMonthTotals.get(monthKey) ?? { activeItemCount: 0, totalAmount: 0 }
    current.activeItemCount += 1
    current.totalAmount += item.amount
    paidMonthTotals.set(monthKey, current)
  })
  return {
    averagePaidMonthAmount: calculatePaidMonthAverage([...paidMonthTotals.values()]),
    details,
    month,
    state: 'ready',
    totalAmount: details.reduce((sum, detail) => sum + detail.amount, 0),
    weeks: groupPayrollDetailsByWeek(
      records.weekDetails
        .filter(
          (detail) =>
            detail.attendance_records.actual_started_at !== null &&
            detail.attendance_records.actual_ended_at !== null,
        )
        .map((detail) => ({
          amount: detail.amount,
          workDate: detail.shift_assignments.shifts.work_date,
          workedMinutes: detail.regular_minutes + detail.overtime_minutes,
        })),
    ).map((week) => ({ ...week, coverage: 'full-week' as const })),
  }
}
