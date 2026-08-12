import 'server-only'

import { requireRole } from '@/shared/auth/session'

import { buildScheduleHistoryRows, getMonthDateRange } from '../domain/schedule-history'
import {
  getScheduleHistoryForMonthRecords,
  getScheduleHistoryMonthRecords,
} from '../repositories/schedule-history-repository'
import type { ScheduleHistoryRow } from '../schemas/schedule-history-view-model'

// 브라우저 저장소(로컬 오버레이) 항목과 합치는 작업은 클라이언트 쪽에서 수행하므로,
// 여기서는 월별로 집계하지 않고 DB에 등록된 날짜 원본 목록만 반환한다.
export async function getScheduleHistoryMonthDatesController(): Promise<string[]> {
  await requireRole('admin')
  const records = await getScheduleHistoryMonthRecords()
  return records.map((record) => record.work_date)
}

export async function getScheduleHistoryForMonthController(
  month: string,
): Promise<ScheduleHistoryRow[]> {
  await requireRole('admin')
  const { monthEndExclusive, monthStart } = getMonthDateRange(month)
  const records = await getScheduleHistoryForMonthRecords(monthStart, monthEndExclusive)
  const workerNamesById = new Map(records.profiles.map((profile) => [profile.id, profile.name]))
  return buildScheduleHistoryRows(records.shifts, workerNamesById)
}
