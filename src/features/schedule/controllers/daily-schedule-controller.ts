import 'server-only'

import { requireRole } from '@/shared/auth/session'
import { POSITION_CATALOG, type PositionId } from '@/shared/domain/positions'

import { getDailyScheduleAssignments, getDailyWorkerCandidates } from '../domain/daily-schedule'
import { validateScheduleStructure } from '../domain/monthly-registration'
import { formatScheduleWorkerSummary } from '../lib/schedule-worker-summary'
import {
  cancelDailyScheduleRecord,
  getDailyScheduleRecords,
  updateDailyScheduleRecord,
} from '../repositories/daily-schedule-repository'
import type {
  CancelDailyScheduleInput,
  DailyScheduleActionResult,
  UpdateDailyScheduleInput,
} from '../schemas/daily-schedule'
import type { DailyScheduleViewModel } from '../schemas/daily-schedule-view-model'

const positionIds = new Set<string>(POSITION_CATALOG.map((position) => position.id))

const errorMessages = {
  DUPLICATE_WORKER: '한 일정에 같은 인원을 중복 배정할 수 없습니다.',
  EXTRA_SLOT_MUST_BE_TRAINING: '추가 슬롯은 교육 인원만 사용할 수 있습니다.',
  FORBIDDEN: '이 작업을 수행할 권한이 없습니다.',
  IDEMPOTENCY_KEY_REUSED: '이미 사용한 요청입니다. 화면을 새로고침해 주세요.',
  INVALID_CAPACITY: '포지션별 필수 인원을 확인해 주세요.',
  INVALID_DATE: '일정 날짜를 확인해 주세요.',
  INVALID_ASSIGNMENT: '배정 정보를 확인해 주세요.',
  INVALID_INPUT: '입력 내용을 확인해 주세요.',
  INVALID_TIME: '근무 종료 시각은 시작 시각보다 늦어야 합니다.',
  SHIFT_NOT_CANCELLABLE: '이 일정은 취소할 수 없습니다.',
  SHIFT_NOT_EDITABLE: '이 일정은 수정할 수 없습니다.',
  SHIFT_NOT_FOUND: '일정을 찾지 못했습니다.',
  STALE_SHIFT: '일정 정보가 변경되었습니다. 최신 상태를 다시 불러와 주세요.',
  WORKER_INACTIVE_OR_WAGE_MISSING: '비활성 인원이거나 시급이 설정되지 않은 인원이 있습니다.',
  WORKER_NOT_APPLIED: '선택한 날짜에 신청하지 않은 신규 배정 인원이 있습니다.',
} as const

function mapMutationError(error: { message: string } | null) {
  if (!error) return null
  const code = (Object.keys(errorMessages) as Array<keyof typeof errorMessages>).find((candidate) =>
    error.message.includes(candidate),
  )
  return {
    code: code ?? 'SAVE_FAILED',
    message: (code && errorMessages[code]) ?? '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    ok: false as const,
  }
}

function isExactDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
}

export async function getAdminDailyScheduleController(
  date: string,
): Promise<DailyScheduleViewModel> {
  await requireRole('admin')
  if (!isExactDate(date)) return { date, state: 'invalid' }
  const records = await getDailyScheduleRecords(date)
  if (!records.shift) return { date, state: 'not-found' }
  const assignments = getDailyScheduleAssignments(
    records.shift.shift_assignments,
    records.shift.status,
  )
  const currentWorkerIds = new Set(assignments.map((assignment) => assignment.worker_id))
  const candidateProfiles = getDailyWorkerCandidates(records.profiles, currentWorkerIds)
  const viewModel: DailyScheduleViewModel = {
    assignments: assignments.map((assignment) => ({
      id: assignment.id,
      isTraining: assignment.is_training,
      positionId: assignment.position_id as PositionId,
      slotIndex: assignment.slot_index,
      status: assignment.status,
      workerId: assignment.worker_id,
    })),
    canEditStructure: records.shift.status === 'published',
    date,
    shift: {
      cancellationReason: records.shift.cancellation_reason,
      cancelledAt: records.shift.cancelled_at,
      ceremonyCount: records.shift.ceremony_count,
      endTime: records.shift.end_time.slice(0, 5),
      id: records.shift.id,
      startTime: records.shift.start_time.slice(0, 5),
      status: records.shift.status,
      updatedAt: records.shift.updated_at,
    },
    state: 'ready',
    workers: candidateProfiles.map((profile) => {
      const workerPositions = records.skills
        .filter((skill) => skill.worker_id === profile.id && positionIds.has(skill.position_id))
        .map((skill) => skill.position_id as PositionId)
      return {
        appliedDates: records.applications
          .filter(
            (application) =>
              application.worker_id === profile.id && application.status === 'applied',
          )
          .map((application) => application.work_date),
        id: profile.id,
        isActive: profile.is_active,
        isSelectable: profile.isSelectable,
        name: profile.name,
        positionIds: workerPositions,
        summary: formatScheduleWorkerSummary(
          records.previousAssignments.filter((assignment) => assignment.worker_id === profile.id),
        ),
      }
    }),
  }
  return viewModel
}

export async function updateDailyScheduleController(
  input: UpdateDailyScheduleInput,
): Promise<DailyScheduleActionResult> {
  await requireRole('admin')
  const errors = validateScheduleStructure({
    assignments: input.assignments,
    ceremonyCount: input.ceremonyCount,
    endTime: input.endTime,
    startTime: input.startTime,
    workDate: '',
  })
  if (errors.length > 0) {
    const code = errors[0].code
    return {
      code,
      message: errorMessages[code],
      ok: false,
    }
  }
  const result = await updateDailyScheduleRecord(input)
  return (
    mapMutationError(result.error) ?? {
      data: result.data as Record<string, unknown>,
      message: '일정과 배정을 수정했습니다.',
      ok: true,
    }
  )
}

export async function cancelDailyScheduleController(
  input: CancelDailyScheduleInput,
): Promise<DailyScheduleActionResult> {
  await requireRole('admin')
  const result = await cancelDailyScheduleRecord(input)
  return (
    mapMutationError(result.error) ?? {
      data: result.data as Record<string, unknown>,
      message: '일정을 취소하고 이력을 보존했습니다.',
      ok: true,
    }
  )
}
