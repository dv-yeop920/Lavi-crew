import { z } from 'zod'

import type { FormActionResult } from '@/shared/forms/form-result'

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, '대상 월을 확인해 주세요.')
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '신청 날짜를 확인해 주세요.')
const versionSchema = z.iso.datetime({ offset: true })

export const monthlyApplicationSchema = z.object({
  expectedPeriodUpdatedAt: versionSchema,
  month: monthSchema,
  periodId: z.uuid(),
  requestId: z.uuid(),
  selectedDates: z.array(dateSchema),
})

export const scheduleApplicationPeriodSchema = z
  .object({
    applicationDates: z.array(dateSchema).min(1, '신청 날짜를 한 개 이상 선택해 주세요.'),
    applicationDeadline: z.iso.datetime({ offset: true }),
    expectedPeriodUpdatedAt: versionSchema.nullable(),
    month: monthSchema,
    periodId: z.uuid().nullable(),
    requestId: z.uuid(),
  })
  .superRefine((value, context) => {
    if (value.periodId && !value.expectedPeriodUpdatedAt) {
      context.addIssue({
        code: 'custom',
        message: '최신 신청 기간 정보를 다시 불러와 주세요.',
        path: ['expectedPeriodUpdatedAt'],
      })
    }
  })

export const scheduleApplicationPeriodStatusSchema = z.object({
  expectedPeriodUpdatedAt: versionSchema,
  nextStatus: z.enum(['open', 'closed']),
  periodId: z.uuid(),
  requestId: z.uuid(),
})

export const scheduleApplicationPeriodCancelSchema = z.object({
  expectedPeriodUpdatedAt: versionSchema,
  periodId: z.uuid(),
  requestId: z.uuid(),
})

export type MonthlyApplicationInput = z.infer<typeof monthlyApplicationSchema>
export type ScheduleApplicationPeriodInput = z.infer<typeof scheduleApplicationPeriodSchema>
export type ScheduleApplicationPeriodStatusInput = z.infer<
  typeof scheduleApplicationPeriodStatusSchema
>
export type ScheduleApplicationPeriodCancelInput = z.infer<
  typeof scheduleApplicationPeriodCancelSchema
>
export type MonthlyApplicationActionResult = FormActionResult & {
  data?: { appliedCount: number; cancelledCount: number; selectedDates: string[] }
}

export function parseJsonFormData<T extends z.ZodType>(
  formData: FormData,
  schema: T,
): z.ZodSafeParseResult<z.output<T>> {
  const payload = formData.get('payload')
  if (typeof payload !== 'string') return schema.safeParse(null)
  try {
    return schema.safeParse(JSON.parse(payload) as unknown)
  } catch {
    return schema.safeParse(null)
  }
}
