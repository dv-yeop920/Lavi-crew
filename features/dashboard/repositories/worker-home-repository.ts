import 'server-only'

import { createServerSupabaseClient } from '@/shared/supabase/server'

export async function getWorkerHomeRecords(input: {
  currentMonthStart: string
  nowIso: string
  today: string
  workerId: string
}) {
  const supabase = await createServerSupabaseClient()
  const [nextAssignments, period, notices] = await Promise.all([
    supabase
      .from('shift_assignments')
      .select(
        'id, position_id, is_training, positions(name), shifts!inner(id, work_date, start_time, end_time, status)',
      )
      .eq('worker_id', input.workerId)
      .eq('status', 'confirmed')
      .eq('shifts.status', 'published')
      .gte('shifts.work_date', input.today)
      .order('work_date', { referencedTable: 'shifts' })
      .limit(10),
    supabase
      .from('schedule_application_periods')
      .select('id, year_month, application_deadline, status, updated_at')
      .eq('status', 'open')
      .gt('application_deadline', input.nowIso)
      .gte('year_month', input.currentMonthStart)
      .order('year_month')
      .limit(1)
      .maybeSingle(),
    supabase
      .from('notices')
      .select('id, title, content, is_pinned, created_at, notice_reads(read_at, worker_id)')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(3),
  ])
  if (nextAssignments.error || period.error || notices.error)
    throw new Error('홈 데이터를 조회하지 못했습니다.')
  const applications = period.data
    ? await supabase
        .from('schedule_applications')
        .select('id', { count: 'exact', head: true })
        .eq('worker_id', input.workerId)
        .eq('application_period_id', period.data.id)
        .eq('status', 'applied')
    : { count: 0, error: null }
  if (applications.error) throw new Error('신청 현황을 조회하지 못했습니다.')
  return {
    applicationCount: applications.count ?? 0,
    nextAssignments: nextAssignments.data ?? [],
    notices: notices.data ?? [],
    period: period.data,
  }
}
