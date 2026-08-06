import 'server-only'

import { requireRole } from '@/shared/auth/session'
import { isPortfolioDemoEnabled } from '@/shared/demo/portfolio-demo-config'
import {
  containsPortfolioDemoWorkerId,
  getPortfolioDemoWorkers,
} from '@/shared/demo/portfolio-fixtures'
import { POSITION_CATALOG, type PositionId } from '@/shared/domain/positions'

import {
  getApplicationPeriodViewState,
  normalizeMonthlyApplicationDates,
} from '../domain/monthly-application'
import {
  getScheduleSummaries,
  getUnregisteredWeekendDates,
  type RegistrationRuleErrorCode,
  validateMonthlyRegistration,
} from '../domain/monthly-registration'
import { formatScheduleWorkerSummary } from '../lib/schedule-worker-summary'
import {
  getAdminMonthScheduleRecords,
  getWorkerMonthApplicationRecords,
  saveMonthlyScheduleRegistrationRecord,
  saveScheduleApplicationPeriodRecord,
  saveWorkerMonthlyApplicationsRecord,
  setScheduleApplicationPeriodStatusRecord,
} from '../repositories/schedule-repository'
import type {
  MonthlyApplicationActionResult,
  MonthlyApplicationInput,
  ScheduleApplicationPeriodInput,
  ScheduleApplicationPeriodStatusInput,
} from '../schemas/monthly-application'
import type {
  MonthlyRegistrationInput,
  ScheduleActionResult,
} from '../schemas/monthly-registration'
import type { MonthRegistrationViewModel } from '../schemas/schedule-view-model'

function getMonthBounds(month: string) {
  const monthStart = `${month}-01`
  const date = new Date(`${monthStart}T00:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() + 1)
  return { monthEnd: date.toISOString().slice(0, 10), monthStart }
}

export async function getAdminMonthScheduleController(
  month: string,
  asOf = new Date(),
): Promise<MonthRegistrationViewModel> {
  await requireRole('admin')
  const { monthEnd, monthStart } = getMonthBounds(month)
  const records = await getAdminMonthScheduleRecords(monthStart, monthEnd)
  const registeredSchedules = getScheduleSummaries(records.shifts)
  const periodViewState = records.period
    ? getApplicationPeriodViewState(
        records.period.status,
        records.period.application_deadline,
        records.shifts.length > 0,
        asOf,
      )
    : null
  const workers = records.profiles.map((profile) => {
    const positionIds = records.skills
      .filter((skill) => skill.worker_id === profile.id)
      .map((skill) => skill.position_id)
      .filter((positionId): positionId is PositionId =>
        POSITION_CATALOG.some((position) => position.id === positionId),
      )
    const workerAssignments = records.previousAssignments.filter(
      (assignment) => assignment.worker_id === profile.id,
    )
    return {
      appliedDates: records.applications
        .filter(
          (application) => application.worker_id === profile.id && application.status === 'applied',
        )
        .map((application) => application.work_date),
      id: profile.id,
      isDemo: false,
      name: profile.name,
      positionIds,
      summary: formatScheduleWorkerSummary(positionIds, workerAssignments),
    }
  })

  if (isPortfolioDemoEnabled()) {
    workers.push(
      ...getPortfolioDemoWorkers(month).map((worker) => ({
        appliedDates: worker.appliedDates,
        id: worker.id,
        isDemo: true,
        name: worker.name,
        positionIds: worker.positionIds,
        summary: worker.summary,
      })),
    )
  }

  return {
    hasScheduleHistory: records.shifts.length > 0,
    month,
    period: {
      applicationDeadline: records.period?.application_deadline ?? null,
      canReopen: periodViewState?.canReopen ?? false,
      closedReason: periodViewState?.closedReason ?? null,
      id: records.period?.id ?? null,
      status: periodViewState?.status ?? 'open',
      updatedAt: records.period?.updated_at ?? null,
    },
    registeredSchedules,
    unregisteredWeekendDates: getUnregisteredWeekendDates(
      month,
      records.shifts.map((shift) => shift.work_date),
    ),
    workers,
  }
}

const applicationErrorMessages = {
  APPLICATION_PERIOD_CLOSED: '신청 기간이 마감되었습니다.',
  FORBIDDEN: '이 작업을 수행할 권한이 없습니다.',
  IDEMPOTENCY_KEY_REUSED: '이미 사용한 요청입니다. 화면을 새로고침해 주세요.',
  INVALID_APPLICATION_DATE: '해당 월의 주말 날짜만 신청할 수 있습니다.',
  INVALID_INPUT: '입력 내용을 확인해 주세요.',
  PERIOD_CANNOT_BE_REOPENED: '게시된 일정이 있거나 마감 시각이 지나 다시 열 수 없습니다.',
  PERIOD_HAS_SCHEDULE_HISTORY: '일정이 등록된 월의 신청 마감 시각은 변경할 수 없습니다.',
  PERIOD_NOT_FOUND: '먼저 해당 월의 신청 기간을 열어 주세요.',
  STALE_PERIOD: '신청 기간이 변경되었습니다. 최신 상태를 다시 불러와 주세요.',
} as const

function mapApplicationError(error: { message: string } | null) {
  if (!error) return null
  const code = (
    Object.keys(applicationErrorMessages) as Array<keyof typeof applicationErrorMessages>
  ).find((candidate) => error.message.includes(candidate))
  return {
    code: code ?? 'SAVE_FAILED',
    message:
      (code && applicationErrorMessages[code]) ??
      '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    ok: false as const,
  }
}

export async function getWorkerMonthApplicationController(month: string, asOf = new Date()) {
  await requireRole('worker')
  const { monthEnd, monthStart } = getMonthBounds(month)
  const records = await getWorkerMonthApplicationRecords(monthStart, monthEnd)
  const periodViewState = records.period
    ? getApplicationPeriodViewState(
        records.period.status,
        records.period.application_deadline,
        false,
        asOf,
      )
    : null
  return {
    month,
    period: records.period
      ? {
          applicationDeadline: records.period.application_deadline,
          closedReason: periodViewState?.closedReason ?? null,
          id: records.period.id,
          status: periodViewState?.status ?? 'closed',
          updatedAt: records.period.updated_at,
        }
      : null,
    selectedDates: records.applications
      .filter((application) => application.status === 'applied')
      .map((application) => application.work_date),
  }
}

export async function saveWorkerMonthlyApplicationsController(
  input: MonthlyApplicationInput,
): Promise<MonthlyApplicationActionResult> {
  await requireRole('worker')
  const { dates, errors } = normalizeMonthlyApplicationDates(input.month, input.selectedDates)
  if (errors.length > 0) {
    return {
      code: errors[0].code,
      fieldErrors: { selectedDates: ['해당 월의 주말 날짜만 선택해 주세요.'] },
      message: '신청 날짜를 확인해 주세요.',
      ok: false,
    }
  }
  const result = await saveWorkerMonthlyApplicationsRecord({ ...input, selectedDates: dates })
  const mappedError = mapApplicationError(result.error)
  if (mappedError) return mappedError
  return {
    data: result.data as {
      appliedCount: number
      cancelledCount: number
      selectedDates: string[]
    },
    message: '월별 신청 날짜를 저장했습니다.',
    ok: true,
  }
}

export async function saveScheduleApplicationPeriodController(
  input: ScheduleApplicationPeriodInput,
): Promise<ScheduleActionResult> {
  await requireRole('admin')
  const result = await saveScheduleApplicationPeriodRecord(input)
  return mapApplicationError(result.error) ?? { message: '신청 기간을 저장했습니다.', ok: true }
}

export async function setScheduleApplicationPeriodStatusController(
  input: ScheduleApplicationPeriodStatusInput,
): Promise<ScheduleActionResult> {
  await requireRole('admin')
  const result = await setScheduleApplicationPeriodStatusRecord(input)
  return (
    mapApplicationError(result.error) ?? {
      message:
        input.nextStatus === 'open' ? '신청 기간을 다시 열었습니다.' : '신청을 마감했습니다.',
      ok: true,
    }
  )
}

const domainErrorMessages = {
  DUPLICATE_WORKER: '같은 날짜에 한 인원을 두 번 배정할 수 없습니다.',
  EXTRA_SLOT_MUST_BE_TRAINING: '추가 슬롯은 교육 인원으로만 등록할 수 있습니다.',
  INVALID_CAPACITY: '포지션별 기본 인원과 교육 추가 인원을 확인해 주세요.',
  INVALID_DATE: '등록할 주말 날짜를 확인해 주세요.',
  INVALID_TIME: '근무 종료 시간은 시작 시간보다 늦어야 합니다.',
} satisfies Record<RegistrationRuleErrorCode, string>

const safeErrorMessages = {
  APPLICATION_PERIOD_OPEN: '신청 기간을 마감한 뒤 일정을 게시해 주세요.',
  DATE_ALREADY_REGISTERED: '이미 등록된 날짜가 있습니다. 최신 일정을 다시 확인해 주세요.',
  DEMO_WORKER_READ_ONLY:
    '데모 인원은 화면 시연용입니다. 실제 일정을 저장하려면 등록된 회원만 배정해 주세요.',
  FORBIDDEN: '일정을 등록할 권한이 없습니다.',
  IDEMPOTENCY_KEY_REUSED: '이미 사용한 저장 요청입니다. 페이지를 새로고침해 주세요.',
  INVALID_INPUT: '예식 개수와 근무 시간을 확인해 주세요.',
  PERIOD_NOT_FOUND: '먼저 해당 월의 신청 기간을 열어 주세요.',
  PERIOD_DEADLINE_MISMATCH: '신청 마감 정보가 변경되었습니다. 최신 상태를 다시 불러와 주세요.',
  STALE_PERIOD: '신청 마감 정보가 변경되었습니다. 최신 상태를 다시 불러와 주세요.',
  WAGE_NOT_CONFIGURED: '시급이 설정되지 않은 인원이 있습니다.',
  WORKER_INACTIVE: '비활성화된 인원이 포함되어 있습니다.',
  WORKER_NOT_APPLIED: '선택한 날짜에 신청하지 않은 인원이 포함되어 있습니다.',
  ...domainErrorMessages,
}

type SafeErrorCode = keyof typeof safeErrorMessages

export async function saveMonthlyScheduleRegistrationController(
  input: MonthlyRegistrationInput,
): Promise<ScheduleActionResult> {
  await requireRole('admin')
  if (
    containsPortfolioDemoWorkerId(
      input.schedules.flatMap((schedule) =>
        schedule.assignments.map((assignment) => assignment.workerId),
      ),
    )
  ) {
    return {
      code: 'DEMO_WORKER_READ_ONLY',
      message: safeErrorMessages.DEMO_WORKER_READ_ONLY,
      ok: false,
    }
  }
  const ruleErrors = validateMonthlyRegistration(input.month, input.schedules)
  if (ruleErrors.length > 0) {
    const firstError = ruleErrors[0]
    return {
      code: firstError.code,
      fieldErrors: { [firstError.path]: [safeErrorMessages[firstError.code]] },
      message: safeErrorMessages[firstError.code],
      ok: false,
    }
  }

  const deadline = new Date(
    `${input.applicationDeadlineDate}T${input.applicationDeadlineTime}:00+09:00`,
  )
  if (Number.isNaN(deadline.valueOf())) {
    return { code: 'INVALID_INPUT', message: '신청 마감일을 확인해 주세요.', ok: false }
  }

  const result = await saveMonthlyScheduleRegistrationRecord({
    applicationDeadline: deadline.toISOString(),
    expectedPeriodUpdatedAt: input.expectedPeriodUpdatedAt,
    monthStart: `${input.month}-01`,
    requestId: input.requestId,
    schedules: input.schedules,
  })
  if (result.error) {
    const code = (Object.keys(safeErrorMessages) as SafeErrorCode[]).find((candidate) =>
      result.error.message.includes(candidate),
    )
    return {
      code: code ?? 'SAVE_FAILED',
      message:
        (code && safeErrorMessages[code]) ??
        '일정을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      ok: false,
    }
  }
  const data = result.data as {
    confirmedAssignmentCount: number
    pendingNotificationCount: number
    publishedScheduleCount: number
  }
  return {
    data,
    message: `${data.publishedScheduleCount}일 일정과 ${data.confirmedAssignmentCount}명 배정을 확정했습니다. 알림 ${data.pendingNotificationCount}건을 발송 대기로 기록했습니다.`,
    ok: true,
  }
}
