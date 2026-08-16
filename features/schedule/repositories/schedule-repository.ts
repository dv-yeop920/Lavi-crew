import 'server-only'

import type { Json } from '@/shared/supabase/database.types'
import { createServerSupabaseClient } from '@/shared/supabase/server'

import type {
  MonthlyApplicationInput,
  ScheduleApplicationPeriodCancelInput,
  ScheduleApplicationPeriodInput,
  ScheduleApplicationPeriodStatusInput,
} from '../schemas/monthly-application'
import type { MonthlyRegistrationInput } from '../schemas/monthly-registration'

export async function getAdminMonthScheduleRecords(monthStart: string, monthEnd: string) {
  const supabase = await createServerSupabaseClient()
  const previousMonthEnd = monthStart
  const previousMonthStart = new Date(`${monthStart}T00:00:00Z`)
  previousMonthStart.setUTCMonth(previousMonthStart.getUTCMonth() - 1)
  const previousMonthStartValue = previousMonthStart.toISOString().slice(0, 10)

  const [period, shifts, workers] = await Promise.all([
    supabase
      .from('schedule_application_periods')
      .select('id, status, application_deadline, updated_at')
      .eq('year_month', monthStart)
      .maybeSingle(),
    supabase
      .from('shifts')
      .select(
        'id, work_date, start_time, end_time, ceremony_count, status, cancellation_reason, shift_assignments(id, position_id, slot_index, status, updated_at)',
      )
      .gte('work_date', monthStart)
      .lt('work_date', monthEnd)
      .order('work_date'),
    supabase.rpc('get_admin_month_schedule_workers', {
      p_month_end: monthEnd,
      p_month_start: monthStart,
      p_previous_month_start: previousMonthStartValue,
    }),
  ])

  const error = period.error || shifts.error || workers.error
  if (error) throw new Error('일정 등록 데이터를 조회하지 못했습니다.')

  return {
    period: period.data,
    shifts: shifts.data ?? [],
    workers: workers.data ?? [],
  }
}

export async function getWorkerMonthApplicationRecords(monthStart: string, monthEnd: string) {
  const supabase = await createServerSupabaseClient()
  const [period, applications] = await Promise.all([
    supabase
      .from('schedule_application_periods')
      .select('id, year_month, application_deadline, status, updated_at')
      .eq('year_month', monthStart)
      .maybeSingle(),
    supabase
      .from('schedule_applications')
      .select('id, application_period_id, work_date, status, cancelled_at, updated_at')
      .gte('work_date', monthStart)
      .lt('work_date', monthEnd)
      .order('work_date'),
  ])
  if (period.error || applications.error) throw new Error('월별 신청 정보를 조회하지 못했습니다.')
  return { applications: applications.data ?? [], period: period.data }
}

export async function saveWorkerMonthlyApplicationsRecord(input: MonthlyApplicationInput) {
  const supabase = await createServerSupabaseClient()
  return supabase.rpc('save_own_monthly_schedule_applications', {
    p_expected_period_updated_at: input.expectedPeriodUpdatedAt,
    p_period_id: input.periodId,
    p_request_id: input.requestId,
    p_selected_dates: input.selectedDates,
  })
}

export async function saveScheduleApplicationPeriodRecord(input: ScheduleApplicationPeriodInput) {
  const supabase = await createServerSupabaseClient()
  return supabase.rpc('save_schedule_application_period', {
    p_application_deadline: input.applicationDeadline,
    p_expected_updated_at: input.expectedPeriodUpdatedAt as string,
    p_period_id: input.periodId as string,
    p_request_id: input.requestId,
    p_year_month: `${input.month}-01`,
  })
}

export async function setScheduleApplicationPeriodStatusRecord(
  input: ScheduleApplicationPeriodStatusInput,
) {
  const supabase = await createServerSupabaseClient()
  return supabase.rpc('set_schedule_application_period_status', {
    p_expected_updated_at: input.expectedPeriodUpdatedAt,
    p_next_status: input.nextStatus,
    p_period_id: input.periodId,
    p_request_id: input.requestId,
  })
}

export async function cancelScheduleApplicationPeriodRecord(
  input: ScheduleApplicationPeriodCancelInput,
) {
  const supabase = await createServerSupabaseClient()
  return supabase.rpc('cancel_schedule_application_period', {
    p_expected_updated_at: input.expectedPeriodUpdatedAt,
    p_period_id: input.periodId,
    p_request_id: input.requestId,
  })
}

export async function saveMonthlyScheduleRegistrationRecord(input: {
  applicationDeadline: string
  expectedPeriodUpdatedAt: string | null
  monthStart: string
  requestId: string
  schedules: MonthlyRegistrationInput['schedules']
}) {
  const supabase = await createServerSupabaseClient()
  return supabase.rpc('save_monthly_schedule_registration', {
    p_application_deadline: input.applicationDeadline,
    p_expected_period_updated_at: input.expectedPeriodUpdatedAt as string,
    p_request_id: input.requestId,
    p_schedules: input.schedules as unknown as Json,
    p_year_month: input.monthStart,
  })
}
