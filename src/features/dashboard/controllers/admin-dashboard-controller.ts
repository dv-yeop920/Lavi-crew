import 'server-only'

import { requireRole } from '@/shared/auth/session'

import {
  getEffectiveApplicationPeriodStatus,
  getKstDashboardDateRange,
} from '../domain/admin-dashboard'
import { getAdminDashboardRecords } from '../repositories/admin-dashboard-repository'
import type { AdminDashboardViewModel } from '../schemas/admin-dashboard-view-model'

export async function getAdminDashboardController(
  asOf = new Date(),
): Promise<AdminDashboardViewModel> {
  const range = getKstDashboardDateRange(asOf)
  const [, records] = await Promise.all([requireRole('admin'), getAdminDashboardRecords(range)])
  function buildMonth(monthStart: string) {
    const record = records.periods.find((period) => period.year_month === monthStart) ?? null
    const effectiveStatus = record
      ? getEffectiveApplicationPeriodStatus(record.status, record.application_deadline, asOf)
      : null
    return {
      applicationPeriod:
        record && effectiveStatus
          ? {
              deadline: record.application_deadline,
              effectiveStatus,
              id: record.id,
              requiresClose: record.status === 'open' && effectiveStatus === 'effectively_closed',
              status: record.status,
              updatedAt: record.updated_at,
              yearMonth: record.year_month,
            }
          : null,
      yearMonth: monthStart.slice(0, 7),
    }
  }

  return {
    asOfDate: range.today,
    months: [buildMonth(range.monthStart), buildMonth(range.nextMonthStart)],
    currentWeek: {
      endExclusive: range.weekEndExclusive,
      schedules: records.weekSchedules.map((schedule) => ({
        assignedWorkerCount: schedule.shift_assignments.length,
        ceremonyCount: schedule.ceremony_count,
        date: schedule.work_date,
        endTime: schedule.end_time.slice(0, 5),
        id: schedule.id,
        startTime: schedule.start_time.slice(0, 5),
      })),
      start: range.weekStart,
    },
  }
}
