import 'server-only'

import { requireRole } from '@/shared/auth/session'

import {
  countUnregisteredWeekendDates,
  getEffectiveApplicationPeriodStatus,
  getKstDashboardDateRange,
} from '../domain/admin-dashboard'
import { getAdminDashboardRecords } from '../repositories/admin-dashboard-repository'
import type { AdminDashboardViewModel } from '../schemas/admin-dashboard-view-model'

export async function getAdminDashboardController(
  asOf = new Date(),
): Promise<AdminDashboardViewModel> {
  await requireRole('admin')
  const range = getKstDashboardDateRange(asOf)
  const records = await getAdminDashboardRecords(range)
  const effectiveStatus = records.period
    ? getEffectiveApplicationPeriodStatus(
        records.period.status,
        records.period.application_deadline,
        asOf,
      )
    : null
  return {
    applicationPeriod:
      records.period && effectiveStatus
        ? {
            deadline: records.period.application_deadline,
            effectiveStatus,
            id: records.period.id,
            requiresClose:
              records.period.status === 'open' && effectiveStatus === 'effectively_closed',
            status: records.period.status,
            updatedAt: records.period.updated_at,
            yearMonth: records.period.year_month,
          }
        : null,
    asOfDate: range.today,
    currentMonth: {
      unregisteredWeekendCount: countUnregisteredWeekendDates(
        range.monthStart,
        range.monthEndExclusive,
        records.monthSchedules.map((schedule) => schedule.work_date),
      ),
      yearMonth: range.monthStart.slice(0, 7),
    },
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
