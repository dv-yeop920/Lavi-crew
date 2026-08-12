import { AdminScheduleRegistrationPageView } from '@/features/schedule/views/admin-schedule-registration-page-view'

type AdminScheduleRegistrationPageProps = {
  searchParams: Promise<{ month?: string }>
}

export default async function AdminScheduleRegistrationPage({
  searchParams,
}: AdminScheduleRegistrationPageProps) {
  const { month: monthQuery } = await searchParams
  return <AdminScheduleRegistrationPageView monthQuery={monthQuery} />
}
