import { notFound } from 'next/navigation'

import { getManagedWorkerController } from '../controllers/management-controller'
import { parseUuid } from '../schemas/management-input'

import { WorkerDetailView } from './worker-detail-view'

export async function WorkerDetailPageView({ workerId }: { workerId: string }) {
  const parsedWorkerId = parseUuid(workerId)
  if (!parsedWorkerId.success) notFound()
  const worker = await getManagedWorkerController(parsedWorkerId.data)
  if (!worker) notFound()
  return <WorkerDetailView worker={worker} />
}
