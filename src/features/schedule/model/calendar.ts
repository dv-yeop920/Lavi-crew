export function getLeadingBlankCount(year: number, monthIndex: number) {
  return new Date(year, monthIndex, 1).getDay()
}

export function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

export function isWeekend(year: number, monthIndex: number, day: number) {
  const weekday = new Date(year, monthIndex, day).getDay()
  return weekday === 0 || weekday === 6
}

export function getWeekendType(year: number, monthIndex: number, day: number) {
  const weekday = new Date(year, monthIndex, day).getDay()

  if (weekday === 0) return 'sunday'
  if (weekday === 6) return 'saturday'
  return undefined
}

export function getWeekendDateValues(year: number, monthIndex: number) {
  const month = String(monthIndex + 1).padStart(2, '0')

  return Array.from({ length: getDaysInMonth(year, monthIndex) }, (_, index) => index + 1)
    .filter((day) => isWeekend(year, monthIndex, day))
    .map((day) => `${year}-${month}-${String(day).padStart(2, '0')}`)
}
