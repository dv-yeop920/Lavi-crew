function mondayWeekRange(workDate: string) {
  const date = new Date(`${workDate}T00:00:00Z`)
  const offset = (date.getUTCDay() + 6) % 7
  const start = new Date(date)
  start.setUTCDate(start.getUTCDate() - offset)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 6)
  return { end: end.toISOString().slice(0, 10), start: start.toISOString().slice(0, 10) }
}

export function getMonthCoveringWeekRange(month: string) {
  const monthStart = `${month}-01`
  const nextMonth = new Date(`${monthStart}T00:00:00Z`)
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1)
  const monthEnd = new Date(nextMonth)
  monthEnd.setUTCDate(monthEnd.getUTCDate() - 1)
  const firstWeek = mondayWeekRange(monthStart)
  const lastWeek = mondayWeekRange(monthEnd.toISOString().slice(0, 10))
  const endExclusive = new Date(`${lastWeek.end}T00:00:00Z`)
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1)
  return { endExclusive: endExclusive.toISOString().slice(0, 10), start: firstWeek.start }
}

export function calculatePaidMonthAverage(
  months: Array<{ activeItemCount: number; totalAmount: number }>,
) {
  const paid = months.filter((month) => month.activeItemCount > 0)
  if (paid.length === 0) return 0
  return Math.round(paid.reduce((sum, month) => sum + month.totalAmount, 0) / paid.length)
}

export function groupPayrollDetailsByWeek(
  details: Array<{ amount: number; workDate: string; workedMinutes: number }>,
) {
  const groups = new Map<
    string,
    { amount: number; end: string; shiftCount: number; start: string; workedMinutes: number }
  >()
  details.forEach((detail) => {
    const range = mondayWeekRange(detail.workDate)
    const current = groups.get(range.start) ?? {
      amount: 0,
      end: range.end,
      shiftCount: 0,
      start: range.start,
      workedMinutes: 0,
    }
    current.amount += detail.amount
    current.shiftCount += 1
    current.workedMinutes += detail.workedMinutes
    groups.set(range.start, current)
  })
  return [...groups.values()].sort((left, right) => left.start.localeCompare(right.start))
}
