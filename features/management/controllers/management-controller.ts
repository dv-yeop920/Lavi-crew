import 'server-only'

import { randomBytes } from 'node:crypto'

import { requireRole } from '@/shared/auth/session'
import { POSITION_CATALOG, type PositionId } from '@/shared/domain/positions'
import { maskEmail, maskPhone } from '@/shared/lib/mask-contact'

import { getInviteStatus } from '../domain/invite-status'
import {
  calculateAverageMonthlyApplicationDays,
  getPreviousMonthRange,
  summarizePreviousMonthAttendance,
} from '../domain/worker-stats'
import {
  createInviteRecord,
  deactivateInviteRecord,
  deactivateWorkerProfileRecord,
  getInviteRecords,
  getWorkerHistoryRecords,
  getWorkerManagementRecords,
  getWorkerProfileRecord,
  updateWorkerProfileRecord,
} from '../repositories/management-repository'
import type { ManagementActionResult } from '../schemas/management-input'

const positionIds = new Set<string>(POSITION_CATALOG.map((position) => position.id))

function safePositionIds(values: string[]) {
  return values.filter((value): value is PositionId => positionIds.has(value))
}

function buildHistory(
  assignments: Awaited<ReturnType<typeof getWorkerManagementRecords>>['assignments'],
  workerId: string,
  asOf: Date,
) {
  const range = getPreviousMonthRange(asOf)
  const summary = summarizePreviousMonthAttendance(
    assignments
      .filter(
        (assignment) =>
          assignment.worker_id === workerId &&
          assignment.shifts &&
          assignment.attendance_records &&
          positionIds.has(assignment.position_id),
      )
      .map((assignment) => ({
        positionId: assignment.position_id as PositionId,
        status: assignment.attendance_records!.status,
        workDate: assignment.shifts!.work_date,
      })),
    range,
    POSITION_CATALOG,
  )
  return {
    history: [
      `지난달 출근 ${summary.attendanceCount}회`,
      ...summary.positionCounts.map((position) => `${position.name} ${position.count}회`),
    ].join(' · '),
  }
}

export async function getManagedWorkersController(asOf = new Date()) {
  await requireRole('admin')
  const records = await getWorkerManagementRecords()
  return records.profiles.map((profile) => {
    const history = buildHistory(records.assignments, profile.id, asOf)
    return {
      ...history,
      averageMonthlyApplicationDays: calculateAverageMonthlyApplicationDays(
        records.applications
          .filter((application) => application.worker_id === profile.id && application.shifts)
          .map((application) => ({
            status: application.status,
            workDate: application.shifts!.work_date,
          })),
      ),
      email: maskEmail(profile.email),
      hourlyWage: profile.hourly_wage,
      id: profile.id,
      isActive: profile.is_active,
      joinedAt: profile.created_at,
      name: profile.name,
      phone: maskPhone(profile.phone),
      positionIds: safePositionIds(
        records.skills
          .filter((skill) => skill.worker_id === profile.id)
          .map((skill) => skill.position_id),
      ),
      role: profile.role,
    }
  })
}

export async function getManagedWorkerController(workerId: string, asOf = new Date()) {
  await requireRole('admin')
  const [detail, records] = await Promise.all([
    getWorkerProfileRecord(workerId),
    getWorkerHistoryRecords(workerId),
  ])
  if (!detail.profile) return null
  const profile = detail.profile
  const history = buildHistory(records.assignments, profile.id, asOf)
  return {
    ...history,
    averageMonthlyApplicationDays: calculateAverageMonthlyApplicationDays(
      records.applications
        .filter((application) => application.worker_id === profile.id && application.shifts)
        .map((application) => ({
          status: application.status,
          workDate: application.shifts!.work_date,
        })),
    ),
    email: maskEmail(profile.email),
    hourlyWage: profile.hourly_wage,
    id: profile.id,
    isActive: profile.is_active,
    joinedAt: profile.created_at,
    name: profile.name,
    phone: maskPhone(profile.phone),
    positionIds: safePositionIds(detail.skills.map((skill) => skill.position_id)),
    role: profile.role,
  }
}

export async function updateManagedWorkerController(input: {
  hourlyWage: number
  name: string
  positionIds: string[]
  workerId: string
}): Promise<ManagementActionResult> {
  await requireRole('admin')
  if (input.positionIds.some((positionId) => !positionIds.has(positionId))) {
    return { code: 'INVALID_POSITION', message: '가능한 포지션을 확인해 주세요.', ok: false }
  }
  const { error } = await updateWorkerProfileRecord(input)
  return error
    ? { code: 'WORKER_UPDATE_FAILED', message: '회원 정보를 저장하지 못했습니다.', ok: false }
    : { message: '회원 정보와 가능한 포지션을 저장했습니다.', ok: true }
}

export async function deactivateManagedWorkerController(
  workerId: string,
): Promise<ManagementActionResult> {
  await requireRole('admin')
  const { error } = await deactivateWorkerProfileRecord(workerId)
  return error
    ? {
        code: 'WORKER_DEACTIVATE_FAILED',
        message: '관리자이거나 이미 비활성화된 회원은 삭제할 수 없습니다.',
        ok: false,
      }
    : { message: '회원을 비활성화했습니다. 기존 근무와 급여 이력은 보존됩니다.', ok: true }
}

export async function getInvitesController(asOf = new Date()) {
  await requireRole('admin')
  return (await getInviteRecords()).map((invite) => ({
    code: invite.code,
    expiresAt: invite.expires_at,
    id: invite.id,
    label: invite.label,
    maxUses: invite.max_uses,
    status: getInviteStatus(
      {
        expiresAt: invite.expires_at,
        isActive: invite.is_active,
        maxUses: invite.max_uses,
        usedCount: invite.used_count,
      },
      asOf,
    ),
    usedCount: invite.used_count,
  }))
}

export async function createInviteController(input: {
  expiresAt: string
  label: string
  maxUses: number
}): Promise<ManagementActionResult> {
  const admin = await requireRole('admin')
  const code = `LAVI-${randomBytes(6).toString('hex').toUpperCase()}`
  const { error } = await createInviteRecord({ ...input, code, createdBy: admin.id })
  return error
    ? { code: 'INVITE_CREATE_FAILED', message: '초대 코드를 생성하지 못했습니다.', ok: false }
    : { message: `초대 코드를 생성했습니다: ${code}`, ok: true }
}

export async function deactivateInviteController(
  inviteId: string,
): Promise<ManagementActionResult> {
  await requireRole('admin')
  const { data, error } = await deactivateInviteRecord(inviteId)
  return error || !data
    ? { code: 'INVITE_DEACTIVATE_FAILED', message: '초대 코드를 중지하지 못했습니다.', ok: false }
    : { message: '초대 코드 사용을 중지했습니다.', ok: true }
}
