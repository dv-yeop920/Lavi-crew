import { WorkerFullSchedulePageView } from '@/features/schedule/view/worker-full-schedule-page-view'

type WorkerFullSchedulePageProps = {
  searchParams: Promise<{ month?: string }>
}

export default async function WorkerFullSchedulePage({
  searchParams,
}: WorkerFullSchedulePageProps) {
  const { month } = await searchParams
  return <WorkerFullSchedulePageView monthQuery={month} />
}
