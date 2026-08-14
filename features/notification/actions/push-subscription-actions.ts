'use server'

import type { FormActionResult } from '@/shared/forms/form-result'

import {
  subscribePushController,
  unsubscribePushController,
} from '../controllers/push-subscription-controller'

export async function subscribePushAction(input: {
  endpoint: string
  keyAuth: string
  keyP256dh: string
}): Promise<FormActionResult> {
  if (!input.endpoint || !input.keyAuth || !input.keyP256dh) {
    return { code: 'INVALID_SUBSCRIPTION', message: '구독 정보가 올바르지 않습니다.', ok: false }
  }
  return subscribePushController(input)
}

export async function unsubscribePushAction(endpoint: string): Promise<FormActionResult> {
  if (!endpoint) {
    return { code: 'INVALID_ENDPOINT', message: '구독 정보가 올바르지 않습니다.', ok: false }
  }
  return unsubscribePushController(endpoint)
}
