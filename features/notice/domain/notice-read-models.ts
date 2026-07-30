export type SortableNotice = {
  createdAt: string
  id: string
  isPinned: boolean
}

export function sortNoticesPinnedFirst<T extends SortableNotice>(notices: T[]) {
  return [...notices].sort(
    (left, right) =>
      Number(right.isPinned) - Number(left.isPinned) ||
      right.createdAt.localeCompare(left.createdAt) ||
      left.id.localeCompare(right.id),
  )
}

export function countActiveNoticeReads(readWorkerIds: string[], activeWorkerIds: Set<string>) {
  return new Set(readWorkerIds.filter((workerId) => activeWorkerIds.has(workerId))).size
}
