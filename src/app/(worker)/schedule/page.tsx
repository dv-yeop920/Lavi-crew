import { WorkerSchedulePageView } from '@/features/schedule/view/worker-schedule-page-view'

type WorkerSchedulePageProps = {
  searchParams: Promise<{ anchor?: string; mode?: string }>
}

export default async function WorkerSchedulePage({ searchParams }: WorkerSchedulePageProps) {
  const { anchor, mode } = await searchParams
  return <WorkerSchedulePageView anchorQuery={anchor} modeQuery={mode} />
}
