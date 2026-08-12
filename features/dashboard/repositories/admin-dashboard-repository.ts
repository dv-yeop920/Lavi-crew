import 'server-only'

import { createServerSupabaseClient } from '@/shared/supabase/server'

export async function getAdminDashboardRecords(input: {
  monthEndExclusive: string
  monthStart: string
  nextMonthEndExclusive: string
  nextMonthStart: string
  weekEndExclusive: string
  weekStart: string
}) {
  const supabase = await createServerSupabaseClient()
  const [weekSchedules, periods, monthSchedules] = await Promise.all([
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
    // published과 cancelled 모두 "이미 등록 결정을 마친 날짜"로 취급한다(취소도 등록 화면에서
    // 재등록 대상이 아니므로, 대시보드의 미등록 카운트를 등록 화면과 같은 기준으로 맞춘다).
    supabase
      .from('shifts')
      .select('work_date')
      .gte('work_date', input.monthStart)
      .lt('work_date', input.nextMonthEndExclusive),
  ])
  if (weekSchedules.error || periods.error || monthSchedules.error)
    throw new Error('관리자 대시보드 데이터를 조회하지 못했습니다.')
  return {
    monthSchedules: monthSchedules.data ?? [],
    periods: periods.data ?? [],
    weekSchedules: weekSchedules.data ?? [],
  }
}
