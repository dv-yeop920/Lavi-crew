import { POSITION_CATALOG, type PositionId } from '@/shared/domain/positions'

type PreviousAssignment = {
  position_id: string
}

function getDemoLastMonthCounts(positionIds: PositionId[]) {
  return positionIds.slice(0, 3).map((id, index) => ({
    count: 3 - index,
    id,
  }))
}

export function formatScheduleWorkerSummary(
  assignments: PreviousAssignment[],
  fallbackPositionIds: PositionId[] = [],
) {
  const counts = POSITION_CATALOG.map((position) => ({
    count: assignments.filter((assignment) => assignment.position_id === position.id).length,
    name: position.name,
  })).filter((position) => position.count > 0)

  const summaryCounts =
    counts.length > 0
      ? counts
      : getDemoLastMonthCounts(fallbackPositionIds).map((position) => ({
          count: position.count,
          name: POSITION_CATALOG.find((item) => item.id === position.id)?.name ?? '',
        }))

  const lastMonthCounts = summaryCounts
    .map((position) => `${position.name} ${position.count}회`)
    .join(', ')

  return lastMonthCounts ? `지난달: ${lastMonthCounts}` : ''
}
