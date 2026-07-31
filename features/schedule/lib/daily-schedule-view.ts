import { POSITION_CATALOG } from '../../../shared/domain/positions'
import type { DailyScheduleViewModel } from '../schemas/daily-schedule-view-model'

type ReadyDailySchedule = Extract<DailyScheduleViewModel, { state: 'ready' }>

export function createDailyPositionDrafts(assignments: ReadyDailySchedule['assignments']) {
  const confirmedAssignments = assignments.filter((assignment) => assignment.status === 'confirmed')
  const displayAssignments =
    confirmedAssignments.length > 0
      ? confirmedAssignments
      : assignments.filter((assignment) => assignment.status === 'cancelled')
  return POSITION_CATALOG.map((position) => {
    const positionAssignments = displayAssignments
      .filter((assignment) => assignment.positionId === position.id)
      .sort((first, second) => first.slotIndex - second.slotIndex)
    const slotCount = Math.max(
      position.defaultAssigneeCount,
      (positionAssignments.at(-1)?.slotIndex ?? -1) + 1,
    )
    return {
      assignedWorkerIds: Array.from(
        { length: slotCount },
        (_, slotIndex) =>
          positionAssignments.find((assignment) => assignment.slotIndex === slotIndex)?.workerId ??
          '',
      ),
      id: position.id,
      minimumAssigneeCount: position.defaultAssigneeCount,
      name: position.name,
      trainingFlags: Array.from(
        { length: slotCount },
        (_, slotIndex) =>
          positionAssignments.find((assignment) => assignment.slotIndex === slotIndex)
            ?.isTraining ?? false,
      ),
    }
  })
}

export function toKoreanDateTimeInput(value: string | null) {
  if (!value) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  })
    .formatToParts(new Date(value))
    .reduce<Record<string, string>>((result, part) => {
      result[part.type] = part.value
      return result
    }, {})
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

export function toKoreanIso(value: string) {
  const date = new Date(`${value}:00+09:00`)
  return Number.isNaN(date.valueOf()) ? null : date.toISOString()
}
