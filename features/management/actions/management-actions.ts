'use server'

import { revalidatePath } from 'next/cache'

import { requireRole } from '@/shared/auth/session'

import {
  createInviteController,
  deactivateInviteController,
  deactivateManagedWorkerController,
  updateManagedWorkerController,
} from '../controllers/management-controller'
import {
  type ManagementActionResult,
  parseInviteCreate,
  parseUuid,
  parseWorkerUpdate,
} from '../schemas/management-input'

export async function updateManagedWorkerAction(
  workerId: string,
  _: ManagementActionResult | null,
  formData: FormData,
): Promise<ManagementActionResult> {
  await requireRole('admin')
  const safeWorkerId = parseUuid(workerId)
  const input = parseWorkerUpdate(formData)
  if (!safeWorkerId || !input)
    return { code: 'INVALID_INPUT', message: '입력한 회원 정보를 확인해 주세요.', ok: false }
  const result = await updateManagedWorkerController({ ...input, workerId: safeWorkerId })
  if (result.ok) {
    revalidatePath('/admin/workers')
    revalidatePath(`/admin/workers/${safeWorkerId}`)
  }
  return result
}

export async function deactivateManagedWorkerAction(
  workerId: string,
  _: ManagementActionResult | null,
): Promise<ManagementActionResult> {
  await requireRole('admin')
  const safeWorkerId = parseUuid(workerId)
  if (!safeWorkerId)
    return { code: 'INVALID_WORKER', message: '회원을 찾을 수 없습니다.', ok: false }
  const result = await deactivateManagedWorkerController(safeWorkerId)
  if (result.ok) {
    revalidatePath('/admin/workers')
    revalidatePath(`/admin/workers/${safeWorkerId}`)
  }
  return result
}

export async function createInviteAction(
  _: ManagementActionResult | null,
  formData: FormData,
): Promise<ManagementActionResult> {
  await requireRole('admin')
  const input = parseInviteCreate(formData)
  if (!input)
    return { code: 'INVALID_INPUT', message: '초대 코드 설정을 확인해 주세요.', ok: false }
  const result = await createInviteController(input)
  if (result.ok) revalidatePath('/admin/invites')
  return result
}

export async function deactivateInviteAction(
  inviteId: string,
  _: ManagementActionResult | null,
): Promise<ManagementActionResult> {
  await requireRole('admin')
  const safeInviteId = parseUuid(inviteId)
  if (!safeInviteId)
    return { code: 'INVALID_INVITE', message: '초대 코드를 찾을 수 없습니다.', ok: false }
  const result = await deactivateInviteController(safeInviteId)
  if (result.ok) revalidatePath('/admin/invites')
  return result
}
