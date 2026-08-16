import { randomUUID } from 'node:crypto'

import { getAdminMonthScheduleController } from '../controllers/schedule-controller'
import { getCanonicalMonth } from '../lib/month-query'

import { AdminScheduleRegistrationView } from './admin-schedule-registration-view'

function getCurrentKoreanMonth() {
  return new Intl.DateTimeFormat('en-CA', {
    month: '2-digit',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  }).format(new Date())
}

export async function AdminScheduleRegistrationPageView({
  datesQuery,
  monthQuery,
}: {
  datesQuery?: string
  monthQuery?: string
}) {
  const month = getCanonicalMonth(monthQuery) ?? getCurrentKoreanMonth()
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
