'use server'

import { revalidatePath } from 'next/cache'

import { requireRole } from '@/shared/auth/session'
import { getZodFieldErrors } from '@/shared/forms/zod-errors'

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
  const parsedWorkerId = parseUuid(workerId)
  const parsed = parseWorkerUpdate(formData)
  if (!parsedWorkerId.success)
    return { code: 'INVALID_WORKER', message: '회원을 찾을 수 없습니다.', ok: false }
  if (!parsed.success)
    return {
      code: 'INVALID_INPUT',
      fieldErrors: getZodFieldErrors(parsed.error),
      message: '입력 항목별 안내를 확인해 주세요.',
      ok: false,
    }
  const result = await updateManagedWorkerController({
    ...parsed.data,
    workerId: parsedWorkerId.data,
  })
  if (result.ok) {
    revalidatePath('/admin/workers')
    revalidatePath(`/admin/workers/${parsedWorkerId.data}`)
  }
  return result
}

export async function deactivateManagedWorkerAction(
  workerId: string,
  _: ManagementActionResult | null,
): Promise<ManagementActionResult> {
  await requireRole('admin')
  const parsedWorkerId = parseUuid(workerId)
  if (!parsedWorkerId.success)
    return { code: 'INVALID_WORKER', message: '회원을 찾을 수 없습니다.', ok: false }
  const result = await deactivateManagedWorkerController(parsedWorkerId.data)
  if (result.ok) {
    revalidatePath('/admin/workers')
    revalidatePath(`/admin/workers/${parsedWorkerId.data}`)
  }
  return result
}

export async function createInviteAction(
  requestId: string,
  _: ManagementActionResult | null,
  formData: FormData,
): Promise<ManagementActionResult> {
  await requireRole('admin')
  const parsed = parseInviteCreate(formData)
  const parsedRequestId = parseUuid(requestId)
  if (!parsedRequestId.success)
    return { code: 'INVALID_REQUEST', message: '요청을 다시 시도해 주세요.', ok: false }
  if (!parsed.success)
    return {
      code: 'INVALID_INPUT',
      fieldErrors: getZodFieldErrors(parsed.error),
      message: '입력 항목별 안내를 확인해 주세요.',
      ok: false,
    }
  const result = await createInviteController({ ...parsed.data, requestId: parsedRequestId.data })
  if (result.ok) revalidatePath('/admin/invites')
  return result
}

export async function deactivateInviteAction(
  inviteId: string,
  requestId: string,
  _: ManagementActionResult | null,
): Promise<ManagementActionResult> {
  await requireRole('admin')
  const parsedInviteId = parseUuid(inviteId)
  const parsedRequestId = parseUuid(requestId)
  if (!parsedInviteId.success)
    return { code: 'INVALID_INVITE', message: '초대 코드를 찾을 수 없습니다.', ok: false }
  if (!parsedRequestId.success)
    return { code: 'INVALID_REQUEST', message: '요청을 다시 시도해 주세요.', ok: false }
  const result = await deactivateInviteController(parsedInviteId.data, parsedRequestId.data)
  if (result.ok) revalidatePath('/admin/invites')
  return result
}
