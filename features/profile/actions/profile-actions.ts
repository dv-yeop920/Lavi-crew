'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { requireRole } from '@/shared/auth/session'

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
  const input = parseProfileUpdate(formData)
  if (!input)
    return { code: 'INVALID_INPUT', message: '이름과 휴대폰 번호를 확인해 주세요.', ok: false }
  const result = await updateOwnProfileController(input)
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
