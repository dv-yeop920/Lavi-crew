export type ApplicationRecord = {
  status: 'applied' | 'cancelled'
  workDate: string
}

export type AttendanceRecord = {
  positionId: string
  status: 'pending' | 'present' | 'absent'
  workDate: string
}

export function getPreviousMonthRange(asOf: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  }).formatToParts(asOf)
  const year = Number(parts.find((part) => part.type === 'year')?.value)
  const month = Number(parts.find((part) => part.type === 'month')?.value)
  const start = new Date(Date.UTC(year, month - 2, 1))
  const end = new Date(Date.UTC(year, month - 1, 1))
  return {
    end: end.toISOString().slice(0, 10),
    start: start.toISOString().slice(0, 10),
  }
}

export function calculateAverageMonthlyApplicationDays(records: ApplicationRecord[]) {
  const daysByMonth = new Map<string, Set<string>>()
  records
    .filter((record) => record.status === 'applied')
    .forEach((record) => {
      const month = record.workDate.slice(0, 7)
      const days = daysByMonth.get(month) ?? new Set<string>()
      days.add(record.workDate)
      daysByMonth.set(month, days)
    })
  if (daysByMonth.size === 0) return 0
  const totalDays = [...daysByMonth.values()].reduce((sum, days) => sum + days.size, 0)
  return Math.round((totalDays / daysByMonth.size) * 10) / 10
}

export function summarizePreviousMonthAttendance(
  records: AttendanceRecord[],
  range: { end: string; start: string },
  positions: readonly { id: string; name: string }[],
) {
  const presentRecords = records.filter(
    (record) =>
      record.status === 'present' && record.workDate >= range.start && record.workDate < range.end,
  )
  const positionCounts = positions.flatMap((position) => {
    const count = presentRecords.filter((record) => record.positionId === position.id).length
    return count > 0 ? [{ count, name: position.name }] : []
  })
  return { attendanceCount: presentRecords.length, positionCounts }
}
