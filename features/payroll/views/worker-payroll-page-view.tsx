import { redirect } from 'next/navigation'

import { getWorkerPayrollController } from '@/features/payroll/controllers/payroll-controller'

import { PayrollView } from './payroll-view'

function getCurrentKoreanMonth() {
  return new Intl.DateTimeFormat('en-CA', {
    month: '2-digit',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  }).format(new Date())
}

export async function WorkerPayrollPageView({ monthQuery }: { monthQuery?: string }) {
  const currentMonth = getCurrentKoreanMonth()
  const viewModel = await getWorkerPayrollController(monthQuery ?? currentMonth)

  if (viewModel.state === 'invalid') {
    redirect(`/payroll?month=${currentMonth}`)
  }

  return <PayrollView viewModel={{ ...viewModel, state: 'ready' }} />
}
