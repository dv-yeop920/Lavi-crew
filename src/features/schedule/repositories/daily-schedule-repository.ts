import 'server-only'

import type { Json } from '@/shared/supabase/database.types'
import { createServerSupabaseClient } from '@/shared/supabase/server'

import type { CancelDailyScheduleInput, UpdateDailyScheduleInput } from '../schemas/daily-schedule'

export async function getDailyScheduleRecords(workDate: string) {
  const supabase = await createServerSupabaseClient()
  const monthStart = `${workDate.slice(0, 7)}-01`
  const previousMonthStart = new Date(`${monthStart}T00:00:00Z`)
  previousMonthStart.setUTCMonth(previousMonthStart.getUTCMonth() - 1)
  const previousMonthStartValue = previousMonthStart.toISOString().slice(0, 10)
  const [shift, profiles, skills, applications, previousAssignments] = await Promise.all([
    supabase
      .from('shifts')
      .select(
        'id, work_date, start_time, end_time, ceremony_count, status, updated_at, cancelled_at, cancellation_reason, shift_assignments(id, worker_id, position_id, slot_index, is_training, status, updated_at)',
      )
      .eq('work_date', workDate)
      .maybeSingle(),
    supabase.from('profiles').select('id, name, role, is_active, hourly_wage').order('name'),
    supabase.from('worker_position_skills').select('worker_id, position_id'),
    supabase
      .from('schedule_applications')
      .select('worker_id, status, work_date')
      .eq('work_date', workDate),
    supabase
      .from('shift_assignments')
      .select('worker_id, position_id, status, shifts!inner(work_date)')
      .eq('status', 'confirmed')
      .gte('shifts.work_date', previousMonthStartValue)
      .lt('shifts.work_date', monthStart),
  ])
  if (
    shift.error ||
    profiles.error ||
    skills.error ||
    applications.error ||
    previousAssignments.error
  )
    throw new Error('일별 일정 데이터를 조회하지 못했습니다.')
  return {
    applications: applications.data ?? [],
    previousAssignments: previousAssignments.data ?? [],
    profiles: profiles.data ?? [],
    shift: shift.data,
    skills: skills.data ?? [],
  }
}

export async function updateDailyScheduleRecord(input: UpdateDailyScheduleInput) {
  const supabase = await createServerSupabaseClient()
  return supabase.rpc('update_daily_schedule', {
    p_assignments: input.assignments as unknown as Json,
    p_ceremony_count: input.ceremonyCount,
    p_end_time: input.endTime,
    p_expected_shift_updated_at: input.expectedShiftUpdatedAt,
    p_request_id: input.requestId,
    p_shift_id: input.shiftId,
    p_start_time: input.startTime,
  })
}

export async function cancelDailyScheduleRecord(input: CancelDailyScheduleInput) {
  const supabase = await createServerSupabaseClient()
  return supabase.rpc('cancel_daily_schedule', {
    p_expected_shift_updated_at: input.expectedShiftUpdatedAt,
    p_reason: input.reason,
    p_request_id: input.requestId,
    p_shift_id: input.shiftId,
  })
}
