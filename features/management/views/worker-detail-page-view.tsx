import { notFound } from 'next/navigation'

import { getManagedWorkerController } from '../controllers/management-controller'
import { parseUuid } from '../schemas/management-input'

import { WorkerDetailView } from './worker-detail-view'

export async function WorkerDetailPageView({ workerId }: { workerId: string }) {
  const safeWorkerId = parseUuid(workerId)
  if (!safeWorkerId) notFound()
  const worker = await getManagedWorkerController(safeWorkerId)
  if (!worker) notFound()
  return <WorkerDetailView worker={worker} />
}
