import { z } from 'zod'

import type { FormActionResult } from '@/shared/forms/form-result'

import { scheduleAssignmentSchema } from './monthly-registration'

const versionSchema = z.iso.datetime({ offset: true })
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, '근무 시간을 확인해 주세요.')

export const updateDailyScheduleSchema = z.object({
  assignments: z.array(scheduleAssignmentSchema),
  ceremonyCount: z.number().int().min(1),
  endTime: timeSchema,
  expectedShiftUpdatedAt: versionSchema,
  requestId: z.uuid(),
  shiftId: z.uuid(),
  startTime: timeSchema,
})

export const cancelDailyScheduleSchema = z.object({
  expectedShiftUpdatedAt: versionSchema,
  reason: z.string().trim().min(2, '취소 사유를 입력해 주세요.').max(500),
  requestId: z.uuid(),
  shiftId: z.uuid(),
})

export const confirmAttendanceSchema = z
  .object({
    actualEndedAt: versionSchema.nullable(),
    actualStartedAt: versionSchema.nullable(),
    attendanceId: z.uuid(),
    correctionReason: z.string().trim().min(2).max(500).nullable(),
    expectedAttendanceUpdatedAt: versionSchema,
    requestId: z.uuid(),
    status: z.enum(['present', 'absent']),
  })
  .superRefine((value, context) => {
    if (value.status === 'present' && (!value.actualStartedAt || !value.actualEndedAt)) {
      context.addIssue({
        code: 'custom',
        message: '출근과 퇴근 시각을 입력해 주세요.',
        path: ['actualStartedAt'],
      })
    }
    if (value.status === 'absent' && (value.actualStartedAt || value.actualEndedAt)) {
      context.addIssue({
        code: 'custom',
        message: '결근에는 근무 시각을 입력할 수 없습니다.',
        path: ['actualStartedAt'],
      })
    }
  })

export type UpdateDailyScheduleInput = z.infer<typeof updateDailyScheduleSchema>
export type CancelDailyScheduleInput = z.infer<typeof cancelDailyScheduleSchema>
export type ConfirmAttendanceInput = z.infer<typeof confirmAttendanceSchema>
export type DailyScheduleActionResult = FormActionResult & { data?: Record<string, unknown> }

export function parseDailyScheduleFormData<T extends z.ZodType>(formData: FormData, schema: T) {
  const payload = formData.get('payload')
  if (typeof payload !== 'string') return schema.safeParse(null)
  try {
    return schema.safeParse(JSON.parse(payload) as unknown)
  } catch {
    return schema.safeParse(null)
  }
}
