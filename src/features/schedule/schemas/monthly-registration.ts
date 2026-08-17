import { z } from 'zod'

import type { FormActionResult } from '../../../shared/forms/form-result'

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식을 확인해 주세요.')
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, '시간 형식을 확인해 주세요.')

export const scheduleAssignmentSchema = z.object({
  isTraining: z.boolean(),
  positionId: z.enum([
    'leader',
    'scan',
    'main',
    'dress',
    'song',
    'manager',
    'guide',
    'waiting-room',
  ]),
  slotIndex: z.number().int().min(0).max(2),
  slotKind: z.enum(['base', 'extra-training']),
  workerId: z.uuid('배정할 인원을 선택해 주세요.'),
})

export const monthlyRegistrationSchema = z.object({
  applicationDeadlineDate: dateSchema,
  applicationDeadlineTime: timeSchema,
  expectedPeriodUpdatedAt: z.iso.datetime({ offset: true }).nullable(),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, '대상 월을 확인해 주세요.'),
  requestId: z.uuid(),
  schedules: z
    .array(
      z.object({
        assignments: z.array(scheduleAssignmentSchema),
        ceremonyCount: z
          .number()
          .int()
          .min(1, '예식 개수는 1개 이상이어야 합니다.')
          .max(10, '예식 개수는 10개 이하여야 합니다.'),
        endTime: timeSchema,
        startTime: timeSchema,
        workDate: dateSchema,
      }),
    )
    .min(1, '등록할 날짜를 한 개 이상 설정해 주세요.'),
})

export type MonthlyRegistrationInput = z.infer<typeof monthlyRegistrationSchema>
export type ScheduleActionResult = FormActionResult & {
  data?: {
    confirmedAssignmentCount: number
    pendingNotificationCount: number
    publishedScheduleCount: number
  }
}

function getRawSchedules(formData: FormData) {
  const payload = formData.get('payload')
  if (typeof payload !== 'string') return []
  try {
    const parsed = JSON.parse(payload) as { schedules?: unknown }
    return Array.isArray(parsed.schedules) ? parsed.schedules : []
  } catch {
    return []
  }
}

function getStableIssuePath(path: PropertyKey[], schedules: unknown[]) {
  if (path[0] !== 'schedules' || typeof path[1] !== 'number') return path.join('.')
  const scheduleIndex = path[1]
  const schedule = schedules[scheduleIndex]
  if (!schedule || typeof schedule !== 'object') return path.join('.')
  const scheduleRecord = schedule as Record<string, unknown>
  const workDate =
    typeof scheduleRecord.workDate === 'string' ? scheduleRecord.workDate : String(scheduleIndex)
  if (path[2] !== 'assignments' || typeof path[3] !== 'number') {
    return `dates.${workDate}.${path.slice(2).join('.')}`
  }
  const assignments = Array.isArray(scheduleRecord.assignments) ? scheduleRecord.assignments : []
  const assignment = assignments[path[3]]
  if (!assignment || typeof assignment !== 'object')
    return `dates.${workDate}.${path.slice(2).join('.')}`
  const assignmentRecord = assignment as Record<string, unknown>
  return `dates.${workDate}.positions.${String(assignmentRecord.positionId)}.slots.${String(assignmentRecord.slotIndex)}.${path.slice(4).join('.')}`
}

export function getMonthlyRegistrationFieldErrors(error: z.ZodError, formData: FormData) {
  const schedules = getRawSchedules(formData)
  return error.issues.reduce<Record<string, string[]>>((fieldErrors, issue) => {
    const path = getStableIssuePath(issue.path, schedules)
    if (!path) return fieldErrors
    fieldErrors[path] = [...(fieldErrors[path] ?? []), issue.message]
    return fieldErrors
  }, {})
}

export function parseMonthlyRegistrationFormData(formData: FormData) {
  const raw = formData.get('payload')
  if (typeof raw !== 'string') return monthlyRegistrationSchema.safeParse(null)
  try {
    return monthlyRegistrationSchema.safeParse(JSON.parse(raw) as unknown)
  } catch {
    return monthlyRegistrationSchema.safeParse(null)
  }
}
