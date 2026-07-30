import 'server-only'

import { createServerSupabaseClient } from '@/shared/supabase/server'

export async function getWorkerPayrollRecords(input: {
  monthEnd: string
  monthStart: string
  weekEnd: string
  weekStart: string
  workerId: string
}) {
  const supabase = await createServerSupabaseClient()
  const detailSelect =
    'id, amount, regular_minutes, overtime_minutes, voided_at, monthly_payrolls!inner(worker_id, year_month), attendance_records!inner(status, actual_started_at, actual_ended_at), shift_assignments!inner(worker_id, position_id, status, positions(name), shifts!inner(id, work_date))'
  const [details, weekDetails, paidItems] = await Promise.all([
    supabase
      .from('payroll_items')
      .select(detailSelect)
      .eq('monthly_payrolls.worker_id', input.workerId)
      .eq('shift_assignments.worker_id', input.workerId)
      .eq('shift_assignments.status', 'confirmed')
      .eq('attendance_records.status', 'present')
      .not('attendance_records.actual_started_at', 'is', null)
      .not('attendance_records.actual_ended_at', 'is', null)
      .is('voided_at', null)
      .gte('shift_assignments.shifts.work_date', input.monthStart)
      .lt('shift_assignments.shifts.work_date', input.monthEnd)
      .order('created_at'),
    supabase
      .from('payroll_items')
      .select(detailSelect)
      .eq('monthly_payrolls.worker_id', input.workerId)
      .eq('shift_assignments.worker_id', input.workerId)
      .eq('shift_assignments.status', 'confirmed')
      .eq('attendance_records.status', 'present')
      .not('attendance_records.actual_started_at', 'is', null)
      .not('attendance_records.actual_ended_at', 'is', null)
      .is('voided_at', null)
      .gte('shift_assignments.shifts.work_date', input.weekStart)
      .lt('shift_assignments.shifts.work_date', input.weekEnd)
      .order('created_at'),
    supabase
      .from('payroll_items')
      .select(
        'id, amount, voided_at, monthly_payrolls!inner(worker_id, year_month), attendance_records!inner(status, actual_started_at, actual_ended_at)',
      )
      .eq('monthly_payrolls.worker_id', input.workerId)
      .eq('attendance_records.status', 'present')
      .not('attendance_records.actual_started_at', 'is', null)
      .not('attendance_records.actual_ended_at', 'is', null)
      .is('voided_at', null),
  ])
  if (details.error || weekDetails.error || paidItems.error)
    throw new Error('확정 급여를 조회하지 못했습니다.')
  return {
    details: details.data ?? [],
    paidItems: paidItems.data ?? [],
    weekDetails: weekDetails.data ?? [],
  }
}
