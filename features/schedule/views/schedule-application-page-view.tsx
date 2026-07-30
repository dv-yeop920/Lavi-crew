import { randomUUID } from 'node:crypto'

import { redirect } from 'next/navigation'

import { getWorkerMonthApplicationController } from '../controllers/schedule-controller'
import { getCanonicalMonth } from '../lib/month-query'

import { ScheduleApplicationView } from './schedule-application-view'

function getCurrentKoreanMonth() {
  return new Intl.DateTimeFormat('en-CA', {
    month: '2-digit',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  }).format(new Date())
}

export async function ScheduleApplicationPageView({ monthQuery }: { monthQuery?: string }) {
  const month = getCanonicalMonth(monthQuery)
  if (!month) redirect(`/schedule/apply?month=${getCurrentKoreanMonth()}`)

  const viewModel = await getWorkerMonthApplicationController(month)
  return <ScheduleApplicationView requestId={randomUUID()} viewModel={viewModel} />
}
