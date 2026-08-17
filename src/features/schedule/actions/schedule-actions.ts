'use server'

import { revalidatePath } from 'next/cache'

import { requireRole } from '@/shared/auth/session'

import {
  cancelScheduleApplicationPeriodController,
  saveMonthlyScheduleRegistrationController,
  saveScheduleApplicationPeriodController,
  saveWorkerMonthlyApplicationsController,
  setScheduleApplicationPeriodStatusController,
} from '../controllers/schedule-controller'
import {
  type MonthlyApplicationActionResult,
  monthlyApplicationSchema,
  parseJsonFormData,
  scheduleApplicationPeriodCancelSchema,
  scheduleApplicationPeriodSchema,
  scheduleApplicationPeriodStatusSchema,
} from '../schemas/monthly-application'
import {
  getMonthlyRegistrationFieldErrors,
  parseMonthlyRegistrationFormData,
  type ScheduleActionResult,
} from '../schemas/monthly-registration'

export async function saveMonthlyScheduleRegistrationAction(
  _: ScheduleActionResult | null,
  formData: FormData,
): Promise<ScheduleActionResult> {
  await requireRole('admin')
  const parsed = parseMonthlyRegistrationFormData(formData)
  if (!parsed.success) {
    return {
      code: 'INVALID_INPUT',
      fieldErrors: getMonthlyRegistrationFieldErrors(parsed.error, formData),
      message: '입력 항목별 안내를 확인해 주세요.',
      ok: false,
    }
  }
  const result = await saveMonthlyScheduleRegistrationController(parsed.data)
  if (result.ok) {
    revalidatePath('/admin')
    revalidatePath('/admin/schedules')
    revalidatePath('/admin/schedules/new')
    parsed.data.schedules.forEach((schedule) =>
      revalidatePath(`/admin/schedules/${schedule.workDate}`),
    )
  }
  return result
}

export async function saveWorkerMonthlyApplicationsAction(
  _: MonthlyApplicationActionResult | null,
  formData: FormData,
): Promise<MonthlyApplicationActionResult> {
  await requireRole('worker')
  const parsed = parseJsonFormData(formData, monthlyApplicationSchema)
  if (!parsed.success) {
    return {
      code: 'INVALID_INPUT',
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: '신청 날짜를 확인해 주세요.',
      ok: false,
    }
  }
  const result = await saveWorkerMonthlyApplicationsController(parsed.data)
  if (result.ok) {
    revalidatePath('/schedule/apply')
    revalidatePath('/admin/schedules/new')
  }
  return result
}

export async function saveScheduleApplicationPeriodAction(
  _: ScheduleActionResult | null,
  formData: FormData,
): Promise<ScheduleActionResult> {
  await requireRole('admin')
  const parsed = parseJsonFormData(formData, scheduleApplicationPeriodSchema)
  if (!parsed.success) {
    return {
      code: 'INVALID_INPUT',
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: '신청 기간을 확인해 주세요.',
      ok: false,
    }
  }
  const result = await saveScheduleApplicationPeriodController(parsed.data)
  if (result.ok) {
    revalidatePath('/admin/schedules')
    revalidatePath('/admin/schedules/new')
    revalidatePath('/schedule/apply')
  }
  return result
}

export async function setScheduleApplicationPeriodStatusAction(
  _: ScheduleActionResult | null,
  formData: FormData,
): Promise<ScheduleActionResult> {
  await requireRole('admin')
  const parsed = parseJsonFormData(formData, scheduleApplicationPeriodStatusSchema)
  if (!parsed.success) {
    return {
      code: 'INVALID_INPUT',
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: '신청 기간 상태를 확인해 주세요.',
      ok: false,
    }
  }
  const result = await setScheduleApplicationPeriodStatusController(parsed.data)
  if (result.ok) {
    revalidatePath('/admin/schedules')
    revalidatePath('/admin/schedules/new')
    revalidatePath('/schedule/apply')
  }
  return result
}

export async function cancelScheduleApplicationPeriodAction(
  _: ScheduleActionResult | null,
  formData: FormData,
): Promise<ScheduleActionResult> {
  await requireRole('admin')
  const parsed = parseJsonFormData(formData, scheduleApplicationPeriodCancelSchema)
  if (!parsed.success) {
    return {
      code: 'INVALID_INPUT',
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: '신청 기간 정보를 확인해 주세요.',
      ok: false,
    }
  }
  const result = await cancelScheduleApplicationPeriodController(parsed.data)
  if (result.ok) {
    revalidatePath('/admin/schedules')
    revalidatePath('/admin/schedules/new')
    revalidatePath('/schedule/apply')
  }
  return result
}
