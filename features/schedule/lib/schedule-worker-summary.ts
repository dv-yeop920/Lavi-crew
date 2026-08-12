import { POSITION_CATALOG } from '@/shared/domain/positions'

type PreviousAssignment = {
  position_id: string
}

export function formatScheduleWorkerSummary(assignments: PreviousAssignment[]) {
  const counts = POSITION_CATALOG.map((position) => ({
    count: assignments.filter((assignment) => assignment.position_id === position.id).length,
    name: position.name,
  })).filter((position) => position.count > 0)

  const lastMonthCounts = counts
    .map((position) => `${position.name} ${position.count}회`)
    .join(', ')

  return lastMonthCounts ? `지난달: ${lastMonthCounts}` : ''
}
