import 'server-only'

import { requireRole } from '@/shared/auth/session'
import type { FormActionResult } from '@/shared/forms/form-result'

import {
  deletePushSubscriptionRecord,
  upsertPushSubscriptionRecord,
} from '../api/push-subscription-repository'

export async function subscribePushController(input: {
  endpoint: string
  keyAuth: string
  keyP256dh: string
}): Promise<FormActionResult> {
  await requireRole('worker')
  const { error } = await upsertPushSubscriptionRecord(input)
  return error
    ? { code: 'SUBSCRIBE_FAILED', message: '푸시 알림 등록에 실패했습니다.', ok: false }
    : { message: '푸시 알림을 등록했습니다.', ok: true }
}

export async function unsubscribePushController(endpoint: string): Promise<FormActionResult> {
  await requireRole('worker')
  const { error } = await deletePushSubscriptionRecord(endpoint)
  return error
    ? { code: 'UNSUBSCRIBE_FAILED', message: '푸시 알림 해제에 실패했습니다.', ok: false }
    : { message: '푸시 알림을 해제했습니다.', ok: true }
}
