import 'server-only'

import { redirect } from 'next/navigation'

import { getAuthenticatedProfile, getSessionUserId } from '@/shared/auth/session'

import { getWorkerPayrollRecords } from '../api/payroll-repository'
import type { WorkerPayrollViewModel } from '../schema/payroll-view-model'

import {
  calculatePaidMonthAverage,
  getMonthCoveringWeekRange,
  groupPayrollDetailsByWeek,
} from './payroll-read-models'

function monthBounds(month: string) {
  const start = `${month}-01`
  const end = new Date(`${start}T00:00:00Z`)
  end.setUTCMonth(end.getUTCMonth() + 1)
  return { end: end.toISOString().slice(0, 10), start }
}

export async function getWorkerPayrollController(month: string): Promise<WorkerPayrollViewModel> {
  const userId = await getSessionUserId()
  if (!userId) redirect('/')
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
  const [profile, records] = await Promise.all([
    getAuthenticatedProfile(),
    getWorkerPayrollRecords({
      monthEnd: bounds.end,
      monthStart: bounds.start,
      weekEnd: weekBounds.endExclusive,
      weekStart: weekBounds.start,
      workerId: userId,
    }),
  ])
  if (!profile || profile.role !== 'worker') redirect(profile?.role === 'admin' ? '/admin' : '/')
  const details = records.details.map((detail) => ({
    amount: detail.amount,
    id: detail.id,
    overtimeMinutes: detail.overtime_minutes,
    positionName: detail.shift_assignments.positions.name,
    regularMinutes: detail.regular_minutes,
    shiftEndTime: detail.shift_assignments.shifts.end_time,
    shiftId: detail.shift_assignments.shifts.id,
    shiftStartTime: detail.shift_assignments.shifts.start_time,
    workDate: detail.shift_assignments.shifts.work_date,
  }))
  const paidMonthTotals = new Map<string, { activeItemCount: number; totalAmount: number }>()
  records.paidItems.forEach((item) => {
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
      records.weekDetails.map((detail) => ({
        amount: detail.amount,
        workDate: detail.shift_assignments.shifts.work_date,
        workedMinutes: detail.regular_minutes + detail.overtime_minutes,
      })),
    ).map((week) => ({ ...week, coverage: 'full-week' as const })),
  }
}
