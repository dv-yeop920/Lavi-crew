import 'server-only'

import { createServerSupabaseClient } from '@/shared/supabase/server'

export async function getScheduleHistoryMonthRecords() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.from('shifts').select('work_date')
  if (error) throw new Error('일정 이력 월 목록을 조회하지 못했습니다.')
  return data ?? []
}

export async function getScheduleHistoryForMonthRecords(
  monthStart: string,
  monthEndExclusive: string,
) {
  const supabase = await createServerSupabaseClient()
  const [shifts, profiles] = await Promise.all([
    supabase
      .from('shifts')
      .select(
        'work_date, start_time, end_time, ceremony_count, status, shift_assignments(worker_id, position_id, is_training, status)',
      )
      .gte('work_date', monthStart)
      .lt('work_date', monthEndExclusive)
      .order('work_date'),
    supabase.rpc('get_active_profile_names'),
  ])
  if (shifts.error || profiles.error) throw new Error('일정 이력 데이터를 조회하지 못했습니다.')
  return { profiles: profiles.data ?? [], shifts: shifts.data ?? [] }
}
