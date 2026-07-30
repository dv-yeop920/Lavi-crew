import { AdminSchedulePageView } from '@/features/schedule/views/admin-schedule-page-view'

type AdminSchedulesPageProps = {
  searchParams: Promise<{ month?: string }>
}

export default async function AdminSchedulesPage({ searchParams }: AdminSchedulesPageProps) {
  const { month: monthQuery } = await searchParams
  return <AdminSchedulePageView monthQuery={monthQuery} />
}
