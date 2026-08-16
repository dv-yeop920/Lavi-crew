import { randomUUID } from 'node:crypto'

import { getAdminMonthScheduleController } from '../controllers/schedule-controller'
import { getCanonicalMonth, getCurrentKoreanMonth } from '../lib/month-query'

import { AdminScheduleView } from './admin-schedule-view'

export async function AdminSchedulePageView({ monthQuery }: { monthQuery?: string }) {
  const month = getCanonicalMonth(monthQuery) ?? getCurrentKoreanMonth()
  const viewModel = await getAdminMonthScheduleController(month)
  return <AdminScheduleView requestId={randomUUID()} viewModel={viewModel} />
}
