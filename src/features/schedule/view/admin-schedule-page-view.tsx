import { randomUUID } from 'node:crypto'

import { getCanonicalMonth, getCurrentKoreanMonth } from '../model/month-query'
import { getAdminMonthScheduleController } from '../model/schedule-controller'

import { AdminScheduleView } from './admin-schedule-view'

export async function AdminSchedulePageView({ monthQuery }: { monthQuery?: string }) {
  const month = getCanonicalMonth(monthQuery) ?? getCurrentKoreanMonth()
  const viewModel = await getAdminMonthScheduleController(month)
  return <AdminScheduleView requestId={randomUUID()} viewModel={viewModel} />
}
