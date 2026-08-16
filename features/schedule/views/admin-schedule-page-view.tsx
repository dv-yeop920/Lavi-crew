import { randomUUID } from 'node:crypto'

import { getAdminMonthScheduleController } from '../controllers/schedule-controller'
import { getCanonicalMonth } from '../lib/month-query'

import { AdminScheduleView } from './admin-schedule-view'

function getCurrentKoreanMonth() {
  return new Intl.DateTimeFormat('en-CA', {
    month: '2-digit',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  }).format(new Date())
}

export async function AdminSchedulePageView({ monthQuery }: { monthQuery?: string }) {
  const month = getCanonicalMonth(monthQuery) ?? getCurrentKoreanMonth()
  const viewModel = await getAdminMonthScheduleController(month)
  return <AdminScheduleView requestId={randomUUID()} viewModel={viewModel} />
}
