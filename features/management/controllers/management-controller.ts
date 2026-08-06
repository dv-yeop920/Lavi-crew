import 'server-only'

import { requireRole } from '@/shared/auth/session'
import { isPortfolioDemoEnabled } from '@/shared/demo/portfolio-demo-config'
import {
  getPortfolioDemoWorker,
  getPortfolioDemoWorkers,
  isPortfolioDemoWorkerId,
} from '@/shared/demo/portfolio-fixtures'
import { POSITION_CATALOG, type PositionId } from '@/shared/domain/positions'
import { maskEmail, maskPhone } from '@/shared/lib/mask-contact'
import { getProfileUniqueConflict } from '@/shared/lib/postgres-conflict'

import { createInviteCodeFromRequestId } from '../domain/invite-code'
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
  const managedWorkers = records.profiles.map((profile) => {
    const history = buildHistory(records.assignments, profile.id, asOf)
    return {
      ...history,
      averageMonthlyApplicationDays: calculateAverageMonthlyApplicationDays(
        records.applications
          .filter((application) => application.worker_id === profile.id)
          .map((application) => ({
            status: application.status,
            workDate: application.work_date,
          })),
      ),
      email: maskEmail(profile.email),
      hourlyWage: profile.hourly_wage,
      id: profile.id,
      isActive: profile.is_active,
      isDemo: false,
      joinedAt: profile.hired_at,
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
  if (!isPortfolioDemoEnabled()) return managedWorkers

  return [
    ...managedWorkers,
    ...getPortfolioDemoWorkers(asOf.toISOString().slice(0, 7)).map((worker) => ({
      averageMonthlyApplicationDays: worker.applicationAverage,
      email: maskEmail(worker.email),
      history: worker.history,
      hourlyWage: worker.hourlyWage,
      id: worker.id,
      isActive: worker.isActive,
      isDemo: worker.isDemo,
      joinedAt: worker.joinedAt,
      name: worker.name,
      phone: maskPhone(worker.phone),
      positionIds: worker.positionIds,
      role: worker.role,
    })),
  ]
}

export async function getManagedWorkerController(workerId: string, asOf = new Date()) {
  await requireRole('admin')
  if (isPortfolioDemoEnabled() && isPortfolioDemoWorkerId(workerId)) {
    const worker = getPortfolioDemoWorker(workerId, asOf.toISOString().slice(0, 7))
    return worker
      ? {
          averageMonthlyApplicationDays: worker.applicationAverage,
          email: maskEmail(worker.email),
          history: worker.history,
          hourlyWage: worker.hourlyWage,
          id: worker.id,
          isActive: worker.isActive,
          isDemo: worker.isDemo,
          joinedAt: worker.joinedAt,
          name: worker.name,
          phone: maskPhone(worker.phone),
          positionIds: worker.positionIds,
          role: worker.role,
        }
      : null
  }
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
        .filter((application) => application.worker_id === profile.id)
        .map((application) => ({
          status: application.status,
          workDate: application.work_date,
        })),
    ),
    email: maskEmail(profile.email),
    hourlyWage: profile.hourly_wage,
    id: profile.id,
    isActive: profile.is_active,
    isDemo: false,
    joinedAt: profile.hired_at,
    name: profile.name,
    phone: maskPhone(profile.phone),
    positionIds: safePositionIds(detail.skills.map((skill) => skill.position_id)),
    role: profile.role,
  }
}

export async function updateManagedWorkerController(input: {
  hiredAt: string
  hourlyWage: number
  name: string
  positionIds: string[]
  workerId: string
}): Promise<ManagementActionResult> {
  await requireRole('admin')
  if (isPortfolioDemoWorkerId(input.workerId)) {
    return {
      code: 'DEMO_DATA_READ_ONLY',
      message: '데모 인원은 화면 시연용 데이터라 수정할 수 없습니다.',
      ok: false,
    }
  }
  if (input.positionIds.some((positionId) => !positionIds.has(positionId))) {
    return {
      code: 'INVALID_POSITION',
      fieldErrors: { positionIds: ['선택할 수 없는 포지션이 포함되어 있습니다.'] },
      message: '가능한 포지션을 확인해 주세요.',
      ok: false,
    }
  }
  const { error } = await updateWorkerProfileRecord(input)
  if (getProfileUniqueConflict(error) === 'name') {
    return {
      code: 'NAME_ALREADY_EXISTS',
      fieldErrors: { name: ['이미 다른 회원이 사용 중인 이름입니다.'] },
      message: '이름을 확인해 주세요.',
      ok: false,
    }
  }
  return error
    ? { code: 'WORKER_UPDATE_FAILED', message: '회원 정보를 저장하지 못했습니다.', ok: false }
    : { message: '회원 정보와 가능한 포지션을 저장했습니다.', ok: true }
}

export async function deactivateManagedWorkerController(
  workerId: string,
): Promise<ManagementActionResult> {
  await requireRole('admin')
  if (isPortfolioDemoWorkerId(workerId)) {
    return {
      code: 'DEMO_DATA_READ_ONLY',
      message: '데모 인원은 화면 시연용 데이터라 삭제할 수 없습니다.',
      ok: false,
    }
  }
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
  requestId: string
}): Promise<ManagementActionResult> {
  await requireRole('admin')
  const code = createInviteCodeFromRequestId(input.requestId)
  const { error } = await createInviteRecord({ ...input, code })
  return error
    ? { code: 'INVITE_CREATE_FAILED', message: '초대 코드를 생성하지 못했습니다.', ok: false }
    : { message: `초대 코드를 생성했습니다: ${code}`, ok: true }
}

export async function deactivateInviteController(
  inviteId: string,
  requestId: string,
): Promise<ManagementActionResult> {
  await requireRole('admin')
  const { error } = await deactivateInviteRecord(inviteId, requestId)
  return error
    ? { code: 'INVITE_DEACTIVATE_FAILED', message: '초대 코드를 중지하지 못했습니다.', ok: false }
    : { message: '초대 코드 사용을 중지했습니다.', ok: true }
}
