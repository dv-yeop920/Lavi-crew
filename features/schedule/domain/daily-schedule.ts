export function getActiveDailyAssignments<T extends { status: string }>(assignments: T[]) {
  return assignments.filter((assignment) => assignment.status === 'confirmed')
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
