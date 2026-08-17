import { AdminScheduleRegistrationPageView } from '@/features/schedule/view/admin-schedule-registration-page-view'

type AdminScheduleRegistrationPageProps = {
  searchParams: Promise<{ dates?: string; month?: string }>
}

export default async function AdminScheduleRegistrationPage({
  searchParams,
}: AdminScheduleRegistrationPageProps) {
  const { dates, month: monthQuery } = await searchParams
  return <AdminScheduleRegistrationPageView datesQuery={dates} monthQuery={monthQuery} />
}
