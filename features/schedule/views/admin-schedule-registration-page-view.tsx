import { randomUUID } from 'node:crypto'

import { redirect } from 'next/navigation'

import { isPortfolioDemoEnabled } from '@/shared/demo/portfolio-demo-config'

import { getAdminMonthScheduleController } from '../controllers/schedule-controller'
import { getCanonicalMonth } from '../lib/month-query'

import { AdminScheduleRegistrationView } from './admin-schedule-registration-view'

export async function AdminScheduleRegistrationPageView({
  demoDate,
  monthQuery,
}: {
  demoDate?: string
  monthQuery?: string
}) {
  const month = getCanonicalMonth(monthQuery)
  if (!month) {
    const currentMonth = new Intl.DateTimeFormat('en-CA', {
      month: '2-digit',
      timeZone: 'Asia/Seoul',
      year: 'numeric',
    }).format(new Date())
    redirect(`/admin/schedules/new?month=${currentMonth}`)
  }
  const viewModel = await getAdminMonthScheduleController(month)
  return (
    <AdminScheduleRegistrationView
      demoEnabled={isPortfolioDemoEnabled()}
      editDemoDate={demoDate}
      requestId={randomUUID()}
      viewModel={viewModel}
    />
  )
}
