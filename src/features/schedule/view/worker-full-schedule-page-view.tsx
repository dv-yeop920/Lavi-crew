import { getCanonicalMonth } from '@/features/schedule/model/month-query'

import { getWorkerFullScheduleController } from '../model/worker-schedule-controller'

import { WorkerFullScheduleView } from './worker-full-schedule-view'

function getCurrentKoreanMonth() {
  return new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  })
    .format(new Date())
    .slice(0, 7)
}

export async function WorkerFullSchedulePageView({ monthQuery }: { monthQuery?: string }) {
  const month = getCanonicalMonth(monthQuery) ?? getCurrentKoreanMonth()
  const rows = await getWorkerFullScheduleController(month)
  return <WorkerFullScheduleView month={month} rows={rows} />
}
