'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { requireRole } from '@/shared/auth/session'
import { getZodFieldErrors } from '@/shared/forms/zod-errors'

import {
  deactivateOwnProfileController,
  updateOwnProfileController,
} from '../controllers/profile-controller'
import { parseProfileUpdate, type ProfileActionResult } from '../schemas/profile-input'

export async function updateOwnProfileAction(
  _: ProfileActionResult | null,
  formData: FormData,
): Promise<ProfileActionResult> {
  await requireRole('worker')
  const parsed = parseProfileUpdate(formData)
  if (!parsed.success)
    return {
      code: 'INVALID_INPUT',
      fieldErrors: getZodFieldErrors(parsed.error),
      message: '입력 항목별 안내를 확인해 주세요.',
      ok: false,
    }
  const result = await updateOwnProfileController(parsed.data)
  if (result.ok) {
    revalidatePath('/profile')
    revalidatePath('/home')
  }
  return result
}

export async function deactivateOwnProfileAction(
  _: ProfileActionResult | null,
): Promise<ProfileActionResult> {
  await requireRole('worker')
  const result = await deactivateOwnProfileController()
  if (result.ok) redirect('/')
  return result
}
