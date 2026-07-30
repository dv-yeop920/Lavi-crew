import { randomUUID } from 'node:crypto'

import { getAdminNoticesController } from '@/features/notice/controllers/notice-controller'

import { AdminNoticeListView } from './admin-notice-list-view'

export async function AdminNoticesPageView() {
  const viewModel = await getAdminNoticesController()
  const requestIds = {
    create: randomUUID(),
    notices: Object.fromEntries(
      viewModel.notices.map((notice) => [
        notice.id,
        { delete: randomUUID(), update: randomUUID() },
      ]),
    ),
  }

  return <AdminNoticeListView requestIds={requestIds} viewModel={viewModel} />
}
