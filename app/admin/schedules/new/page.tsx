import { getWeekendDateValues } from '@/features/schedule/lib/calendar'
import { registeredSchedules } from '@/features/schedule/lib/schedule-fixtures'
import { AdminScheduleRegistrationView } from '@/features/schedule/views/admin-schedule-registration-view'

type AdminScheduleRegistrationPageProps = {
  searchParams: Promise<{ month?: string }>
}

export default async function AdminScheduleRegistrationPage({
  searchParams,
}: AdminScheduleRegistrationPageProps) {
  const { month: monthQuery } = await searchParams
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(monthQuery ?? '')
    ? (monthQuery as string)
    : '2026-07'
  const [year, monthNumber] = month.split('-').map(Number)
  const registeredDates = new Set<string>(registeredSchedules.map((schedule) => schedule.date))
  const dates = getWeekendDateValues(year, monthNumber - 1).filter(
    (date) => !registeredDates.has(date),
  )

  return <AdminScheduleRegistrationView dates={dates} month={month} />
}
