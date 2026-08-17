export type WorkerScheduleMode = 'day' | 'month' | 'week'

export function isExactDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function getWorkerScheduleRange(mode: WorkerScheduleMode, anchor: string) {
  const date = new Date(`${anchor}T00:00:00Z`)
  if (mode === 'day') return { end: anchor, start: anchor }
  if (mode === 'month') {
    const year = date.getUTCFullYear()
    const month = date.getUTCMonth()
    return {
      end: isoDate(new Date(Date.UTC(year, month + 1, 0))),
      start: isoDate(new Date(Date.UTC(year, month, 1))),
    }
  }
  const mondayOffset = (date.getUTCDay() + 6) % 7
  const start = new Date(date)
  start.setUTCDate(start.getUTCDate() - mondayOffset)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 6)
  return { end: isoDate(end), start: isoDate(start) }
}
