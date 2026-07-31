import { randomUUID } from 'node:crypto'

import { notFound } from 'next/navigation'

import { getAdminDailyScheduleController } from '../controllers/daily-schedule-controller'

import { AdminDailyScheduleView } from './admin-daily-schedule-view'

export async function AdminDailySchedulePageView({ date }: { date: string }) {
  const viewModel = await getAdminDailyScheduleController(date)
  if (viewModel.state !== 'ready') notFound()
  return (
    <AdminDailyScheduleView
      requestIds={{
        attendance: Object.fromEntries(
          viewModel.assignments.map((assignment) => [assignment.id, randomUUID()]),
        ),
        cancel: randomUUID(),
        update: randomUUID(),
      }}
      viewModel={viewModel}
    />
  )
}
