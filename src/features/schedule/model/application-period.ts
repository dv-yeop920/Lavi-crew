import type { MonthRegistrationViewModel } from '../schema/schedule-view-model'

export function getStoredApplicationDeadline(deadline: string | null) {
  if (!deadline) return { date: '', time: '' }
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  }).formatToParts(new Date(deadline))
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return {
    date: `${value.year}-${value.month}-${value.day}`,
    time: `${value.hour}:${value.minute}`,
  }
}

export function canPublishMonthlySchedule(period: MonthRegistrationViewModel['period']) {
  return (
    period.status === 'closed' &&
    Boolean(period.id && period.updatedAt && period.applicationDeadline)
  )
}
