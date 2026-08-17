import { AdminSchedulePageView } from '@/features/schedule/view/admin-schedule-page-view'

type AdminSchedulesPageProps = {
  searchParams: Promise<{ month?: string }>
}

export default async function AdminSchedulesPage({ searchParams }: AdminSchedulesPageProps) {
  const { month: monthQuery } = await searchParams
  return <AdminSchedulePageView monthQuery={monthQuery} />
}
