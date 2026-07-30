import { WorkerPayrollPageView } from '@/features/payroll/views/worker-payroll-page-view'

type WorkerPayrollPageProps = {
  searchParams: Promise<{ month?: string }>
}

export default async function PayrollPage({ searchParams }: WorkerPayrollPageProps) {
  const { month } = await searchParams
  return <WorkerPayrollPageView monthQuery={month} />
}
