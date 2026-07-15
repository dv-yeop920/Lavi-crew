export function getLeadingBlankCount(year: number, monthIndex: number) {
  return new Date(year, monthIndex, 1).getDay()
}

export function isWeekend(year: number, monthIndex: number, day: number) {
  const weekday = new Date(year, monthIndex, day).getDay()
  return weekday === 0 || weekday === 6
}
