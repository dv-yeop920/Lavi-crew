type FullWeek = {
  coverage: 'full-week'
  end: string
  start: string
}

export function formatPayrollDate(date: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    weekday: 'short',
  }).format(new Date(`${date}T00:00:00Z`))
}

export function formatFullWeekLabel(week: FullWeek) {
  return `${formatPayrollDate(week.start)}–${formatPayrollDate(week.end)}`
}
