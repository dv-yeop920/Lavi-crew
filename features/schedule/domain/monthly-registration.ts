import { POSITION_CATALOG, type PositionId } from '../../../shared/domain/positions'

export type ScheduleAssignmentInput = {
  isTraining: boolean
  positionId: string
  slotIndex: number
  slotKind: 'base' | 'extra-training'
  workerId: string
}

export type ScheduleInput = {
  assignments: ScheduleAssignmentInput[]
  ceremonyCount: number
  endTime: string
  startTime: string
  workDate: string
}

export type RegistrationRuleErrorCode =
  | 'DUPLICATE_WORKER'
  | 'EXTRA_SLOT_MUST_BE_TRAINING'
  | 'INVALID_CAPACITY'
  | 'INVALID_DATE'
  | 'INVALID_TIME'

export type RegistrationRuleError = {
  code: RegistrationRuleErrorCode
  path: string
}

const positionById = new Map<PositionId, (typeof POSITION_CATALOG)[number]>(
  POSITION_CATALOG.map((position) => [position.id, position]),
)

export function getUnregisteredWeekendDates(month: string, existingShiftDates: string[]) {
  const [year, monthNumber] = month.split('-').map(Number)
  const existingDates = new Set(existingShiftDates)
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  return Array.from({ length: lastDay }, (_, index) => index + 1)
    .map((day) => `${month}-${String(day).padStart(2, '0')}`)
    .filter((date) => {
      const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
      return (weekday === 0 || weekday === 6) && !existingDates.has(date)
    })
}

export function createRegistrationSummary(schedules: ScheduleInput[]) {
  const assignments = schedules.flatMap((schedule) => schedule.assignments)
  return {
    assignmentCount: assignments.length,
    dateCount: schedules.length,
    trainingCount: assignments.filter((assignment) => assignment.isTraining).length,
  }
}

export function getScheduleSummaries(
  shifts: Array<{
    cancellation_reason: string | null
    ceremony_count: number
    end_time: string
    shift_assignments: Array<{
      id: string
      position_id: string
      slot_index: number
      status: string
      updated_at: string
    }>
    start_time: string
    status: string
    work_date: string
  }>,
) {
  return shifts
    .filter((shift) => shift.status === 'published' || shift.status === 'cancelled')
    .map((shift) => ({
      assignedCount:
        shift.status === 'published'
          ? shift.shift_assignments.filter((assignment) => assignment.status === 'confirmed').length
          : new Map(
              shift.shift_assignments
                .filter((assignment) => assignment.status === 'cancelled')
                .sort((left, right) =>
                  `${left.updated_at}:${left.id}`.localeCompare(`${right.updated_at}:${right.id}`),
                )
                .map((assignment) => [
                  `${assignment.position_id}:${assignment.slot_index}`,
                  assignment,
                ]),
            ).size,
      cancellationReason: shift.cancellation_reason,
      ceremonyCount: shift.ceremony_count,
      date: shift.work_date,
      status: shift.status as 'cancelled' | 'published',
      time: `${shift.start_time.slice(0, 5)}–${shift.end_time.slice(0, 5)}`,
    }))
}

function isWeekendInMonth(month: string, workDate: string) {
  if (!workDate.startsWith(`${month}-`)) return false
  const date = new Date(`${workDate}T00:00:00Z`)
  return !Number.isNaN(date.valueOf()) && (date.getUTCDay() === 0 || date.getUTCDay() === 6)
}

export function validateMonthlyRegistration(
  month: string,
  schedules: ScheduleInput[],
): RegistrationRuleError[] {
  const errors: RegistrationRuleError[] = []

  schedules.forEach((schedule, scheduleIndex) => {
    const schedulePath = `dates.${schedule.workDate || scheduleIndex}`
    if (!isWeekendInMonth(month, schedule.workDate)) {
      errors.push({ code: 'INVALID_DATE', path: `${schedulePath}.workDate` })
    }
    errors.push(...validateScheduleStructure(schedule, schedulePath))
  })

  return errors
}

export function validateScheduleStructure(
  schedule: ScheduleInput,
  schedulePath = 'schedule',
): RegistrationRuleError[] {
  const errors: RegistrationRuleError[] = []
  if (schedule.endTime <= schedule.startTime) {
    errors.push({ code: 'INVALID_TIME', path: `${schedulePath}.endTime` })
  }

  const seenWorkers = new Set<string>()
  schedule.assignments.forEach((assignment) => {
    if (seenWorkers.has(assignment.workerId)) {
      errors.push({
        code: 'DUPLICATE_WORKER',
        path: `${schedulePath}.positions.${assignment.positionId}.slots.${assignment.slotIndex}.workerId`,
      })
    }
    seenWorkers.add(assignment.workerId)
  })

  POSITION_CATALOG.forEach((position) => {
    const assignments = schedule.assignments
      .filter((assignment) => assignment.positionId === position.id)
      .sort((left, right) => left.slotIndex - right.slotIndex)
    const base = assignments.filter((assignment) => assignment.slotKind === 'base')
    const extras = assignments.filter((assignment) => assignment.slotKind === 'extra-training')
    const hasExactBaseSlots =
      base.length === position.defaultAssigneeCount &&
      base.every(
        (assignment, index) =>
          assignment.slotIndex === index && positionById.has(assignment.positionId as PositionId),
      )
    const hasValidExtra =
      extras.length <= 1 &&
      extras.every(
        (assignment) =>
          assignment.slotIndex === position.defaultAssigneeCount && assignment.isTraining,
      )
    if (!hasExactBaseSlots || !hasValidExtra) {
      errors.push({
        code: 'INVALID_CAPACITY',
        path: `${schedulePath}.positions.${position.id}`,
      })
    }
    if (extras.some((assignment) => !assignment.isTraining)) {
      errors.push({
        code: 'EXTRA_SLOT_MUST_BE_TRAINING',
        path: `${schedulePath}.positions.${position.id}`,
      })
    }
  })

  if (
    schedule.assignments.some(
      (assignment) => !positionById.has(assignment.positionId as PositionId),
    )
  ) {
    errors.push({ code: 'INVALID_CAPACITY', path: `${schedulePath}.assignments` })
  }
  return errors
}
