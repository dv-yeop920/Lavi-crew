type WorkerAvailability = {
  id: string
  isActive?: boolean
  isSelectable?: boolean
}

export function getWorkerAvailabilityLabel(worker: WorkerAvailability) {
  if (worker.isActive === false) return '비활성 · 신규 선택 불가'
  if (worker.isSelectable === false) return '시급 미설정 · 신규 선택 불가'
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
