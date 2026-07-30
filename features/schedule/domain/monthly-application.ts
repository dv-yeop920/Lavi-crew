export type MonthlyApplicationDateError = {
  code: 'INVALID_APPLICATION_DATE'
  date: string
}

export function getEffectiveApplicationPeriodStatus(
  status: 'closed' | 'open',
  applicationDeadline: string,
  asOf: Date,
) {
  return status === 'closed' || new Date(applicationDeadline).valueOf() <= asOf.valueOf()
    ? 'closed'
    : 'open'
}

export function getApplicationPeriodViewState(
  status: 'closed' | 'open',
  applicationDeadline: string,
  hasPublishedSchedule: boolean,
  asOf: Date,
) {
  const deadlineElapsed = new Date(applicationDeadline).valueOf() <= asOf.valueOf()
  const isManuallyClosed = status === 'closed'

  return {
    canReopen: isManuallyClosed && !deadlineElapsed && !hasPublishedSchedule,
    closedReason: isManuallyClosed
      ? ('manual' as const)
      : deadlineElapsed
        ? ('deadline' as const)
        : null,
    status: isManuallyClosed || deadlineElapsed ? ('closed' as const) : ('open' as const),
  }
}

function isWeekendInMonth(month: string, dateValue: string) {
  if (!dateValue.startsWith(`${month}-`)) return false
  const date = new Date(`${dateValue}T00:00:00Z`)
  return (
    !Number.isNaN(date.valueOf()) &&
    date.toISOString().slice(0, 10) === dateValue &&
    (date.getUTCDay() === 0 || date.getUTCDay() === 6)
  )
}

export function normalizeMonthlyApplicationDates(month: string, selectedDates: string[]) {
  const dates = [...new Set(selectedDates)].sort()
  const errors = dates
    .filter((date) => !isWeekendInMonth(month, date))
    .map<MonthlyApplicationDateError>((date) => ({
      code: 'INVALID_APPLICATION_DATE',
      date,
    }))
  return { dates, errors }
}
