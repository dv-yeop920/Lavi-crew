import { randomUUID } from 'node:crypto'

import { getCanonicalMonth, getCurrentKoreanMonth } from '../model/month-query'
import { getWorkerMonthApplicationController } from '../model/schedule-controller'

import { ScheduleApplicationView } from './schedule-application-view'

export async function ScheduleApplicationPageView({ monthQuery }: { monthQuery?: string }) {
  const month = getCanonicalMonth(monthQuery) ?? getCurrentKoreanMonth()
  const viewModel = await getWorkerMonthApplicationController(month)
  return <ScheduleApplicationView requestId={randomUUID()} viewModel={viewModel} />
}
