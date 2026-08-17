'use server'

import { revalidatePath } from 'next/cache'

import { requireRole } from '@/shared/auth/session'
import { getZodFieldErrors } from '@/shared/forms/zod-errors'

import {
  createNoticeController,
  deleteNoticeController,
  markNoticeReadController,
  updateNoticeController,
} from '../controllers/notice-controller'
import {
  createNoticeSchema,
  deleteNoticeSchema,
  markNoticeReadSchema,
  type NoticeActionResult,
  parseNoticeFormData,
  updateNoticeSchema,
} from '../schemas/notice-input'

function invalidInput(fieldErrors?: NoticeActionResult['fieldErrors']): NoticeActionResult {
  return {
    code: 'INVALID_INPUT',
    fieldErrors,
    message: '입력 항목별 안내를 확인해 주세요.',
    ok: false,
  }
}

function revalidateNoticeViews() {
  revalidatePath('/admin/notices')
  revalidatePath('/notices')
  revalidatePath('/home')
}

export async function createNoticeAction(
  _: NoticeActionResult | null,
  formData: FormData,
): Promise<NoticeActionResult> {
  await requireRole('admin')
  const parsed = parseNoticeFormData(formData, createNoticeSchema)
  if (!parsed.success) return invalidInput(getZodFieldErrors(parsed.error))
  const result = await createNoticeController(parsed.data)
  if (result.ok) revalidateNoticeViews()
  return result
}

export async function updateNoticeAction(
  _: NoticeActionResult | null,
  formData: FormData,
): Promise<NoticeActionResult> {
  await requireRole('admin')
  const parsed = parseNoticeFormData(formData, updateNoticeSchema)
  if (!parsed.success) return invalidInput(getZodFieldErrors(parsed.error))
  const result = await updateNoticeController(parsed.data)
  if (result.ok) revalidateNoticeViews()
  return result
}

export async function deleteNoticeAction(
  _: NoticeActionResult | null,
  formData: FormData,
): Promise<NoticeActionResult> {
  await requireRole('admin')
  const parsed = parseNoticeFormData(formData, deleteNoticeSchema)
  if (!parsed.success) return invalidInput(getZodFieldErrors(parsed.error))
  const result = await deleteNoticeController(parsed.data)
  if (result.ok) revalidateNoticeViews()
  return result
}

export async function markNoticeReadAction(
  _: NoticeActionResult | null,
  formData: FormData,
): Promise<NoticeActionResult> {
  await requireRole('worker')
  const parsed = parseNoticeFormData(formData, markNoticeReadSchema)
  if (!parsed.success) return invalidInput(getZodFieldErrors(parsed.error))
  const result = await markNoticeReadController(parsed.data)
  if (result.ok) {
    revalidatePath('/notices')
    revalidatePath('/home')
  }
  return result
}
