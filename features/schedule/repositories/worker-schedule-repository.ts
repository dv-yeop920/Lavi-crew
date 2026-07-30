import 'server-only'

import { createServerSupabaseClient } from '@/shared/supabase/server'

export async function getWorkerScheduleRecords(input: {
  endDateExclusive: string
  startDate: string
  workerId: string
}) {
  const supabase = await createServerSupabaseClient()
  const result = await supabase
    .from('shift_assignments')
    .select(
      'id, position_id, is_training, status, positions(name), shifts!inner(id, work_date, start_time, end_time, status)',
    )
    .eq('worker_id', input.workerId)
    .eq('status', 'confirmed')
    .eq('shifts.status', 'published')
    .gte('shifts.work_date', input.startDate)
    .lt('shifts.work_date', input.endDateExclusive)
    .order('work_date', { referencedTable: 'shifts' })
  if (result.error) throw new Error('확정 일정을 조회하지 못했습니다.')
  return result.data ?? []
}
