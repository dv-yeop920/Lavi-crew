import { redirect } from 'next/navigation'

import { isPortfolioDemoEnabled } from '@/shared/demo/portfolio-demo-config'

import { getWorkerScheduleController } from '../controllers/worker-schedule-controller'

import { WorkerScheduleView } from './worker-schedule-view'

function getCurrentKoreanDate() {
  return new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  }).format(new Date())
}

export async function WorkerSchedulePageView({
  anchorQuery,
  modeQuery,
}: {
  anchorQuery?: string
  modeQuery?: string
}) {
  const anchor = anchorQuery ?? getCurrentKoreanDate()
  const mode = modeQuery ?? 'month'
  const viewModel = await getWorkerScheduleController({ anchor, mode })
  if (viewModel.state === 'invalid') {
    redirect(`/schedule?mode=month&anchor=${getCurrentKoreanDate()}`)
  }
  return (
    <WorkerScheduleView
      demoEnabled={isPortfolioDemoEnabled()}
      viewModel={{ ...viewModel, state: 'ready' }}
    />
  )
}
