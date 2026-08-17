import { AdminDailySchedulePageView } from '@/features/schedule/view/admin-daily-schedule-page-view'

type AdminDailySchedulePageProps = {
  params: Promise<{ date: string }>
}

export default async function AdminDailySchedulePage({ params }: AdminDailySchedulePageProps) {
  const { date } = await params
  return <AdminDailySchedulePageView date={date} />
}
