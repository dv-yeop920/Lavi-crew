import { getManagedWorkersController } from '../model/management-controller'

import { WorkerManagementView } from './worker-management-view'

export async function WorkerManagementPageView() {
  const workers = await getManagedWorkersController()
  return <WorkerManagementView workers={workers} />
}
