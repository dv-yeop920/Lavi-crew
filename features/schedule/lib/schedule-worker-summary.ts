import { POSITION_CATALOG, type PositionId } from '@/shared/domain/positions'

type PreviousAssignment = {
  position_id: string
}

function getDemoLastMonthCounts(positionIds: PositionId[]) {
  const primaryPositionId = positionIds.includes('manager') ? 'manager' : positionIds[0]
  const secondaryPositionId = positionIds.find((positionId) => positionId !== primaryPositionId)

  return [
    primaryPositionId ? { count: 2, id: primaryPositionId } : null,
    secondaryPositionId ? { count: 1, id: secondaryPositionId } : null,
  ].filter((position): position is { count: number; id: PositionId } => position !== null)
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
