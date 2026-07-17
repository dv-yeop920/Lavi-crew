import { WorkerDetailView } from '@/features/management/views/worker-detail-view'

type AdminWorkerDetailPageProps = {
  params: Promise<{ workerId: string }>
}

export default async function AdminWorkerDetailPage({ params }: AdminWorkerDetailPageProps) {
  const { workerId } = await params

  return <WorkerDetailView workerId={workerId} />
}
