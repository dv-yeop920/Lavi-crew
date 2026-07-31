export function getActiveDailyAssignments<T extends { status: string }>(assignments: T[]) {
  return assignments.filter((assignment) => assignment.status === 'confirmed')
}

export function getDailyScheduleAssignments<
  T extends {
    position_id: string
    slot_index: number
    status: string
    updated_at: string
  },
>(assignments: T[], shiftStatus: string) {
  const confirmed = getActiveDailyAssignments(assignments)
  if (shiftStatus !== 'cancelled') return confirmed

  const latestBySlot = new Map<string, T>()
  assignments
    .filter((assignment) => assignment.status === 'cancelled')
    .forEach((assignment) => {
      const key = `${assignment.position_id}:${assignment.slot_index}`
      const current = latestBySlot.get(key)
      if (!current || current.updated_at < assignment.updated_at) latestBySlot.set(key, assignment)
    })
  return [...latestBySlot.values()].sort(
    (left, right) =>
      left.position_id.localeCompare(right.position_id) || left.slot_index - right.slot_index,
  )
}

export function getDailyWorkerCandidates<
  T extends { hourly_wage: number; id: string; is_active: boolean },
>(profiles: T[], currentWorkerIds: Set<string>) {
  return profiles
    .filter((profile) => profile.is_active || currentWorkerIds.has(profile.id))
    .map((profile) => ({
      ...profile,
      isSelectable: profile.is_active && profile.hourly_wage > 0,
    }))
}
