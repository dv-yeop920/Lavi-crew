export type DashboardDateRange = {
  monthEndExclusive: string
  monthStart: string
  today: string
  weekEndExclusive: string
  weekStart: string
}

function addUtcDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

function nextMonthStart(monthStart: string) {
  const value = new Date(`${monthStart}T00:00:00Z`)
  value.setUTCMonth(value.getUTCMonth() + 1)
  return value.toISOString().slice(0, 10)
}

export function getKstDashboardDateRange(asOf: Date): DashboardDateRange {
  const today = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  }).format(asOf)
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay()
  const weekStart = addUtcDays(today, -((weekday + 6) % 7))
  const monthStart = `${today.slice(0, 7)}-01`
  return {
    monthEndExclusive: nextMonthStart(monthStart),
    monthStart,
    today,
    weekEndExclusive: addUtcDays(weekStart, 7),
    weekStart,
  }
}

export function countUnregisteredWeekendDates(
  monthStart: string,
  monthEndExclusive: string,
  registeredDates: string[],
) {
  const registered = new Set(registeredDates)
  let count = 0
  for (let date = monthStart; date < monthEndExclusive; date = addUtcDays(date, 1)) {
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
    if ((weekday === 0 || weekday === 6) && !registered.has(date)) count += 1
  }
  return count
}

export function getEffectiveApplicationPeriodStatus(
  status: 'closed' | 'open',
  deadline: string,
  asOf: Date,
) {
  if (status === 'closed') return 'closed' as const
  return new Date(deadline) <= asOf ? ('effectively_closed' as const) : ('open' as const)
}
