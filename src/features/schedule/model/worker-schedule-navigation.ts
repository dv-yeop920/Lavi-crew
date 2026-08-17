import type { WorkerScheduleMode } from './worker-read-models'

export function moveWorkerScheduleAnchor(
  mode: WorkerScheduleMode,
  anchor: string,
  direction: -1 | 1,
) {
  const date = new Date(`${anchor}T00:00:00Z`)
  if (mode === 'month') {
    date.setUTCDate(1)
    date.setUTCMonth(date.getUTCMonth() + direction)
  } else {
    date.setUTCDate(date.getUTCDate() + direction * (mode === 'week' ? 7 : 1))
  }
  return date.toISOString().slice(0, 10)
}
