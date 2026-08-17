import { randomUUID } from 'node:crypto'

import { getCanonicalMonth, getCurrentKoreanMonth } from '../model/month-query'
import { getAdminMonthScheduleController } from '../model/schedule-controller'

import { AdminScheduleRegistrationView } from './admin-schedule-registration-view'

export async function AdminScheduleRegistrationPageView({
  datesQuery,
  monthQuery,
}: {
  datesQuery?: string
  monthQuery?: string
}) {
  const month = getCanonicalMonth(monthQuery) ?? getCurrentKoreanMonth()
  const viewModel = await getAdminMonthScheduleController(month)
  const selectableDates = viewModel.period.applicationDates.filter((date) =>
    viewModel.unregisteredDates.includes(date),
  )
  const selectedDates = datesQuery
    ? datesQuery
        .split(',')
        .filter((date) => selectableDates.includes(date))
        .sort()
    : selectableDates
  return (
    <AdminScheduleRegistrationView
      requestId={randomUUID()}
      selectedDates={selectedDates}
      viewModel={viewModel}
    />
  )
}
