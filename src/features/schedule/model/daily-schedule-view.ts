import { POSITION_CATALOG } from '@/shared/domain/positions'

import type { DailyScheduleViewModel } from '../schema/daily-schedule-view-model'

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
