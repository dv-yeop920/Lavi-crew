import 'server-only'

import { createServerSupabaseClient } from '@/shared/supabase/server'

export async function getAdminDashboardRecords(input: {
  monthStart: string
  nextMonthStart: string
  weekEndExclusive: string
  weekStart: string
}) {
  const supabase = await createServerSupabaseClient()
  const [weekSchedules, periods] = await Promise.all([
    supabase
      .from('shifts')
      .select('id, work_date, start_time, end_time, ceremony_count, shift_assignments(id, status)')
      .eq('status', 'published')
      .eq('shift_assignments.status', 'confirmed')
      .gte('work_date', input.weekStart)
      .lt('work_date', input.weekEndExclusive)
      .order('work_date'),
    supabase
      .from('schedule_application_periods')
      .select('id, year_month, application_deadline, status, updated_at')
      .in('year_month', [input.monthStart, input.nextMonthStart]),
  ])
  if (weekSchedules.error || periods.error)
    throw new Error('관리자 대시보드 데이터를 조회하지 못했습니다.')
  return {
    periods: periods.data ?? [],
    weekSchedules: weekSchedules.data ?? [],
  }
}
