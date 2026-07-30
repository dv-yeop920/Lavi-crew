'use server'

import { revalidatePath } from 'next/cache'

import { requireRole } from '@/shared/auth/session'

import {
  cancelDailyScheduleController,
  confirmAttendanceController,
  updateDailyScheduleController,
} from '../controllers/daily-schedule-controller'
import {
  cancelDailyScheduleSchema,
  confirmAttendanceSchema,
  type DailyScheduleActionResult,
  parseDailyScheduleFormData,
  updateDailyScheduleSchema,
} from '../schemas/daily-schedule'

function invalidResult(error: { flatten(): { fieldErrors: Record<string, string[]> } }) {
  return {
    code: 'INVALID_INPUT',
    fieldErrors: error.flatten().fieldErrors,
    message: '입력 항목을 확인해 주세요.',
    ok: false as const,
  }
}

export async function updateDailyScheduleAction(
  _: DailyScheduleActionResult | null,
  formData: FormData,
): Promise<DailyScheduleActionResult> {
  await requireRole('admin')
  const parsed = parseDailyScheduleFormData(formData, updateDailyScheduleSchema)
  if (!parsed.success) return invalidResult(parsed.error)
  const result = await updateDailyScheduleController(parsed.data)
  if (result.ok) {
    revalidatePath('/admin/schedules')
    revalidatePath('/admin/schedules/[date]', 'page')
  }
  return result
}

export async function cancelDailyScheduleAction(
  _: DailyScheduleActionResult | null,
  formData: FormData,
): Promise<DailyScheduleActionResult> {
  await requireRole('admin')
  const parsed = parseDailyScheduleFormData(formData, cancelDailyScheduleSchema)
  if (!parsed.success) return invalidResult(parsed.error)
  const result = await cancelDailyScheduleController(parsed.data)
  if (result.ok) {
    revalidatePath('/admin/schedules')
    revalidatePath('/admin/schedules/[date]', 'page')
  }
  return result
}

export async function confirmAttendanceAction(
  _: DailyScheduleActionResult | null,
  formData: FormData,
): Promise<DailyScheduleActionResult> {
  await requireRole('admin')
  const parsed = parseDailyScheduleFormData(formData, confirmAttendanceSchema)
  if (!parsed.success) return invalidResult(parsed.error)
  const result = await confirmAttendanceController(parsed.data)
  if (result.ok) {
    revalidatePath('/admin/schedules')
    revalidatePath('/admin/schedules/[date]', 'page')
    revalidatePath('/payroll')
  }
  return result
}
