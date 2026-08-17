import { WorkerDetailPageView } from '@/features/management/view/worker-detail-page-view'

type AdminWorkerDetailPageProps = {
  params: Promise<{ workerId: string }>
}

export default async function AdminWorkerDetailPage({ params }: AdminWorkerDetailPageProps) {
  const { workerId } = await params
  return <WorkerDetailPageView workerId={workerId} />
}
