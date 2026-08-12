import { randomUUID } from 'node:crypto'

import { redirect } from 'next/navigation'

import { getAdminMonthScheduleController } from '../controllers/schedule-controller'
import { getCanonicalMonth } from '../lib/month-query'

import { AdminScheduleRegistrationView } from './admin-schedule-registration-view'

export async function AdminScheduleRegistrationPageView({
  datesQuery,
  monthQuery,
}: {
  datesQuery?: string
  monthQuery?: string
}) {
  const month = getCanonicalMonth(monthQuery)
  if (!month) {
    const currentMonth = new Intl.DateTimeFormat('en-CA', {
      month: '2-digit',
      timeZone: 'Asia/Seoul',
      year: 'numeric',
    }).format(new Date())
    redirect(`/admin/schedules/new?month=${currentMonth}`)
  }
  const viewModel = await getAdminMonthScheduleController(month)
  const selectedDates = datesQuery
    ? datesQuery
        .split(',')
        .filter((date) => viewModel.unregisteredDates.includes(date))
        .sort()
    : viewModel.unregisteredDates
  return (
    <AdminScheduleRegistrationView
      requestId={randomUUID()}
      selectedDates={selectedDates}
      viewModel={viewModel}
    />
  )
}
