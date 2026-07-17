type DatedSchedule = {
  date: string
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function getRegisteredSchedulesForWeek<T extends DatedSchedule>(
  schedules: readonly T[],
  referenceDate = new Date(),
) {
  const weekStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  )
  const daysSinceMonday = (weekStart.getDay() + 6) % 7
  weekStart.setDate(weekStart.getDate() - daysSinceMonday)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const startDate = formatLocalDate(weekStart)
  const endDate = formatLocalDate(weekEnd)

  return schedules.filter((schedule) => schedule.date >= startDate && schedule.date <= endDate)
}
