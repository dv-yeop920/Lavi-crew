type WorkerAvailability = {
  appliedDates?: string[]
  id: string
  isActive?: boolean
  isDemo?: boolean
  isSelectable?: boolean
  positionIds?: string[]
}

export function getWorkerOptionsForDate<T extends WorkerAvailability>(
  workers: T[],
  selectedDate?: string,
  currentWorkerId = '',
  positionId?: string,
) {
  return workers.filter((worker) => {
    if (worker.id === currentWorkerId) return true
    const matchesDate = !selectedDate || worker.appliedDates?.includes(selectedDate)
    const matchesPosition = !positionId || worker.positionIds?.includes(positionId)
    return matchesDate && matchesPosition
  })
}

export function getWorkerAvailabilityLabel(worker: WorkerAvailability) {
  if (worker.isActive === false) return '비활성 · 신규 선택 불가'
  if (worker.isSelectable === false) return '시급 미설정 · 신규 선택 불가'
  return null
}

export function getWorkerApplicationLabel(
  worker: WorkerAvailability,
  selectedDate?: string,
  currentWorkerId = '',
) {
  if (
    selectedDate &&
    worker.id === currentWorkerId &&
    !worker.appliedDates?.includes(selectedDate)
  ) {
    return '미신청 · 기존 배정 유지 전용'
  }
  return null
}

export function isWorkerOptionDisabled(
  worker: WorkerAvailability,
  currentWorkerId: string,
  selectedWorkerIds: Set<string>,
) {
  if (worker.id === currentWorkerId) return false
  return worker.isSelectable === false || selectedWorkerIds.has(worker.id)
}
