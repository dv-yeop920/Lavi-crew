import { AdminDailyScheduleView } from '@/features/schedule/views/admin-daily-schedule-view'

type AdminDailySchedulePageProps = {
  params: Promise<{ date: string }>
}

export default async function AdminDailySchedulePage({ params }: AdminDailySchedulePageProps) {
  const { date } = await params
  const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '2026-07-19'

  return <AdminDailyScheduleView date={safeDate} />
}
