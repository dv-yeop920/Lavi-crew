export function movePayrollMonth(month: string, direction: -1 | 1) {
  const date = new Date(`${month}-01T00:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() + direction)
  return date.toISOString().slice(0, 7)
}
