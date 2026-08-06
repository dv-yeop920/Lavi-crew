import 'server-only'

import { createServerSupabaseClient } from '@/shared/supabase/server'

export async function getWorkerManagementRecords() {
  const supabase = await createServerSupabaseClient()
  const [profilesResult, skillsResult, applicationsResult, assignmentsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, name, phone, role, hourly_wage, is_active, hired_at, created_at')
      .order('created_at'),
    supabase.from('worker_position_skills').select('worker_id, position_id'),
    supabase
      .from('schedule_applications')
      .select('worker_id, status, work_date')
      .order('created_at'),
    supabase
      .from('shift_assignments')
      .select('worker_id, position_id, shifts(work_date), attendance_records(status)'),
  ])
  const error =
    profilesResult.error ||
    skillsResult.error ||
    applicationsResult.error ||
    assignmentsResult.error
  if (error) throw new Error('인원 관리 데이터를 조회하지 못했습니다.')
  return {
    applications: applicationsResult.data ?? [],
    assignments: assignmentsResult.data ?? [],
    profiles: profilesResult.data ?? [],
    skills: skillsResult.data ?? [],
  }
}

export async function getWorkerProfileRecord(workerId: string) {
  const supabase = await createServerSupabaseClient()
  const [profileResult, skillsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, name, phone, role, hourly_wage, is_active, hired_at, created_at')
      .eq('id', workerId)
      .maybeSingle(),
    supabase
      .from('worker_position_skills')
      .select('worker_id, position_id')
      .eq('worker_id', workerId),
  ])
  if (profileResult.error || skillsResult.error)
    throw new Error('회원 상세 정보를 조회하지 못했습니다.')
  return {
    profile: profileResult.data,
    skills: skillsResult.data ?? [],
  }
}

export async function getWorkerHistoryRecords(workerId: string) {
  const supabase = await createServerSupabaseClient()
  const [applicationsResult, assignmentsResult] = await Promise.all([
    supabase
      .from('schedule_applications')
      .select('worker_id, status, work_date')
      .eq('worker_id', workerId)
      .order('created_at'),
    supabase
      .from('shift_assignments')
      .select('worker_id, position_id, shifts(work_date), attendance_records(status)')
      .eq('worker_id', workerId),
  ])
  const error = applicationsResult.error || assignmentsResult.error
  if (error) throw new Error('회원 근무 이력을 조회하지 못했습니다.')
  return {
    applications: applicationsResult.data ?? [],
    assignments: assignmentsResult.data ?? [],
  }
}

export async function updateWorkerProfileRecord(input: {
  hiredAt: string
  hourlyWage: number
  name: string
  positionIds: string[]
  workerId: string
}) {
  const supabase = await createServerSupabaseClient()
  return supabase.rpc('admin_update_worker_profile', {
    candidate_hired_at: input.hiredAt,
    candidate_hourly_wage: input.hourlyWage,
    candidate_name: input.name,
    candidate_position_ids: input.positionIds,
    target_worker_id: input.workerId,
  })
}

export async function deactivateWorkerProfileRecord(workerId: string) {
  const supabase = await createServerSupabaseClient()
  return supabase.rpc('admin_deactivate_worker', { target_worker_id: workerId })
}

export async function getInviteRecords() {
  const result = await (
    await createServerSupabaseClient()
  )
    .from('invite_codes')
    .select('id, code, label, expires_at, max_uses, used_count, is_active')
    .order('created_at', { ascending: false })
  if (result.error) throw new Error('초대 코드를 조회하지 못했습니다.')
  return result.data ?? []
}

export async function createInviteRecord(input: {
  code: string
  expiresAt: string
  label: string
  maxUses: number
  requestId: string
}) {
  const supabase = await createServerSupabaseClient()
  return supabase.rpc('create_invite_code', {
    p_code: input.code,
    p_expires_at: input.expiresAt,
    p_label: input.label,
    p_max_uses: input.maxUses,
    p_request_id: input.requestId,
  })
}

export async function deactivateInviteRecord(inviteId: string, requestId: string) {
  return (await createServerSupabaseClient()).rpc('deactivate_invite_code', {
    p_invite_id: inviteId,
    p_request_id: requestId,
  })
}
