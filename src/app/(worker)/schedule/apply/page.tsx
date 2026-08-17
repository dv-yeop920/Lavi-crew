import { ScheduleApplicationPageView } from '@/features/schedule/view/schedule-application-page-view'

type ScheduleApplicationPageProps = {
  searchParams: Promise<{ month?: string }>
}

export default async function ScheduleApplicationPage({
  searchParams,
}: ScheduleApplicationPageProps) {
  const { month: monthQuery } = await searchParams
  return <ScheduleApplicationPageView monthQuery={monthQuery} />
}
