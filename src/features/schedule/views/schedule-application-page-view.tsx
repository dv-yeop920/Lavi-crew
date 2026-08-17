import { randomUUID } from 'node:crypto'

import { getWorkerMonthApplicationController } from '../controllers/schedule-controller'
import { getCanonicalMonth, getCurrentKoreanMonth } from '../lib/month-query'

import { ScheduleApplicationView } from './schedule-application-view'

export async function ScheduleApplicationPageView({ monthQuery }: { monthQuery?: string }) {
  const month = getCanonicalMonth(monthQuery) ?? getCurrentKoreanMonth()
  const viewModel = await getWorkerMonthApplicationController(month)
  return <ScheduleApplicationView requestId={randomUUID()} viewModel={viewModel} />
}
