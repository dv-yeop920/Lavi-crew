import { notFound } from 'next/navigation'

import { getCanonicalMonth } from '@/features/schedule/model/month-query'
import { AdminScheduleHistoryMonthPageView } from '@/features/schedule/view/admin-schedule-history-month-page-view'

type AdminScheduleHistoryMonthPageProps = {
  params: Promise<{ month: string }>
}

export default async function AdminScheduleHistoryMonthPage({
  params,
}: AdminScheduleHistoryMonthPageProps) {
  const { month: monthParam } = await params
  const month = getCanonicalMonth(monthParam)
  if (!month) notFound()
  return <AdminScheduleHistoryMonthPageView month={month} />
}
