import 'server-only'

import { requireRole } from '@/shared/auth/session'

import {
  getWorkerScheduleRange,
  isExactDate,
  type WorkerScheduleMode,
} from '../domain/worker-read-models'
import { getWorkerScheduleRecords } from '../repositories/worker-schedule-repository'
import type { WorkerScheduleViewModel } from '../schemas/worker-schedule-view-model'

function addDay(value: string) {
  const date = new Date(`${value}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

export async function getWorkerScheduleController(input: {
  anchor: string
  mode: string
}): Promise<WorkerScheduleViewModel> {
  const profile = await requireRole('worker')
  if (!isExactDate(input.anchor) || !(['day', 'month', 'week'] as string[]).includes(input.mode)) {
    return {
      anchor: input.anchor,
      mode: 'month',
      range: { end: input.anchor, start: input.anchor },
      shifts: [],
      state: 'invalid',
    }
  }
  const mode = input.mode as WorkerScheduleMode
  const range = getWorkerScheduleRange(mode, input.anchor)
  const records = await getWorkerScheduleRecords({
    endDateExclusive: addDay(range.end),
    startDate: range.start,
    workerId: profile.id,
  })
  return {
    anchor: input.anchor,
    mode,
    range,
    shifts: records.map((record) => ({
      assignmentId: record.id,
      date: record.shifts.work_date,
      endTime: record.shifts.end_time.slice(0, 5),
      isTraining: record.is_training,
      positionId: record.position_id,
      positionName: record.positions.name,
      shiftId: record.shifts.id,
      startTime: record.shifts.start_time.slice(0, 5),
    })),
    state: 'ready',
  }
}
