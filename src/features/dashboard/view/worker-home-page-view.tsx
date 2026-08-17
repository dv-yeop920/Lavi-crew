import { getWorkerHomeController } from '@/features/dashboard/model/worker-home-controller'

import { WorkerHomeView } from './worker-home-view'

export async function WorkerHomePageView() {
  const viewModel = await getWorkerHomeController()
  return <WorkerHomeView viewModel={viewModel} />
}
