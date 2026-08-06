import { notFound } from 'next/navigation'

import { isPortfolioDemoEnabled } from '@/shared/demo/portfolio-demo-config'
import { isPortfolioDemoWorkerId } from '@/shared/demo/portfolio-fixtures'

import { getManagedWorkerController } from '../controllers/management-controller'
import { parseUuid } from '../schemas/management-input'

import { WorkerDetailView } from './worker-detail-view'

export async function WorkerDetailPageView({ workerId }: { workerId: string }) {
  const isDemoWorker = isPortfolioDemoEnabled() && isPortfolioDemoWorkerId(workerId)
  const parsedWorkerId = parseUuid(workerId)
  if (!isDemoWorker && !parsedWorkerId.success) notFound()
  const worker = await getManagedWorkerController(
    isDemoWorker ? workerId : parsedWorkerId.success ? parsedWorkerId.data : '',
  )
  if (!worker) notFound()
  return <WorkerDetailView worker={worker} />
}
