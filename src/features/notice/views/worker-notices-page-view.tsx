import { randomUUID } from 'node:crypto'

import { getWorkerNoticesController } from '@/features/notice/controllers/notice-controller'

import { WorkerNoticeListView } from './worker-notice-list-view'

export async function WorkerNoticesPageView() {
  const viewModel = await getWorkerNoticesController()
  const requestIds = Object.fromEntries(
    viewModel.notices.map((notice) => [notice.id, randomUUID()]),
  )

  return <WorkerNoticeListView requestIds={requestIds} viewModel={viewModel} />
}
