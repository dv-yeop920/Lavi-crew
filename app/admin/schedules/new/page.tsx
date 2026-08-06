import { AdminScheduleRegistrationPageView } from '@/features/schedule/views/admin-schedule-registration-page-view'

type AdminScheduleRegistrationPageProps = {
  searchParams: Promise<{ demoDate?: string; month?: string }>
}

export default async function AdminScheduleRegistrationPage({
  searchParams,
}: AdminScheduleRegistrationPageProps) {
  const { demoDate, month: monthQuery } = await searchParams
  return <AdminScheduleRegistrationPageView demoDate={demoDate} monthQuery={monthQuery} />
}
