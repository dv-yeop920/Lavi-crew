import { POSITION_CATALOG, type PositionId } from '@/shared/domain/positions'

import type {
  ScheduleHistoryMonthSummary,
  ScheduleHistoryRow,
} from '../schema/schedule-history-view-model'

export function getMonthDateRange(month: string) {
  const monthStart = `${month}-01`
  const date = new Date(`${monthStart}T00:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() + 1)
  return { monthEndExclusive: date.toISOString().slice(0, 10), monthStart }
}

export function summarizeScheduleHistoryMonths(workDates: string[]): ScheduleHistoryMonthSummary[] {
  const countByMonth = new Map<string, number>()
  workDates.forEach((workDate) => {
    const month = workDate.slice(0, 7)
    countByMonth.set(month, (countByMonth.get(month) ?? 0) + 1)
  })
  return Array.from(countByMonth.entries())
    .map(([month, registeredDateCount]) => ({ month, registeredDateCount }))
    .sort((left, right) => right.month.localeCompare(left.month))
}

export function buildScheduleHistoryRows(
  shifts: Array<{
    ceremony_count: number
    end_time: string
    shift_assignments: Array<{
      is_training: boolean
      position_id: string
      status: string
      worker_id: string
    }>
    start_time: string
    status: string
    work_date: string
  }>,
  workerNamesById: Map<string, string>,
): ScheduleHistoryRow[] {
  return shifts
    .filter((shift) => shift.status === 'published' || shift.status === 'cancelled')
    .map((shift) => {
      const positionAssignments = Object.fromEntries(
        POSITION_CATALOG.map((position) => [position.id, [] as string[]]),
      ) as Record<PositionId, string[]>

      shift.shift_assignments
        .filter((assignment) => assignment.status === 'confirmed')
        .forEach((assignment) => {
          const positionId = assignment.position_id as PositionId
          const bucket = positionAssignments[positionId]
          if (!bucket) return
          const workerName = workerNamesById.get(assignment.worker_id) ?? '알 수 없음'
          bucket.push(assignment.is_training ? `${workerName}(교육)` : workerName)
        })

      return {
        ceremonyCount: shift.ceremony_count,
        date: shift.work_date,
        endTime: shift.end_time.slice(0, 5),
        positionAssignments,
        startTime: shift.start_time.slice(0, 5),
        status: shift.status as 'cancelled' | 'published',
      }
    })
    .sort((left, right) => left.date.localeCompare(right.date))
}
