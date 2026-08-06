import { POSITION_CATALOG, type PositionId } from '@/shared/domain/positions'

type PreviousAssignment = {
  attendance_records: { status: string } | null
  position_id: string
}

export function formatScheduleWorkerSummary(
  positionIds: PositionId[],
  assignments: PreviousAssignment[],
) {
  const presentAssignments = assignments.filter(
    (assignment) => assignment.attendance_records?.status === 'present',
  )
  const counts = POSITION_CATALOG.map((position) => ({
    count: presentAssignments.filter((assignment) => assignment.position_id === position.id).length,
    name: position.name,
  })).filter((position) => position.count > 0)
  const skills = POSITION_CATALOG.filter((position) => positionIds.includes(position.id))
    .map((position) => position.name)
    .join(', ')

  const lastMonthCounts = counts
    .map((position) => `${position.name} ${position.count}회`)
    .join(', ')

  return [lastMonthCounts ? `지난달: ${lastMonthCounts}` : '', `가능: ${skills || '미설정'}`]
    .filter(Boolean)
    .join(' · ')
}
