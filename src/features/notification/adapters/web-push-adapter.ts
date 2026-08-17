import 'server-only'

import webpush from 'web-push'

import {
  getNotificationTemplateVariables,
  type NotificationDeliveryResult,
} from '../domain/notification-delivery'
import type { ClaimedNotification } from '../schemas/notification'

export type WebPushConfig = {
  vapidPrivateKey: string
  vapidPublicKey: string
  vapidSubject: string
}

export type NotificationSender = {
  send(notification: ClaimedNotification): Promise<NotificationDeliveryResult>
}

export type NotificationEnvironment = Record<string, string | undefined>

export class NotificationConfigurationError extends Error {
  constructor() {
    super('NOTIFICATION_CONFIGURATION_MISSING')
    this.name = 'NotificationConfigurationError'
  }
}

function required(value: string | undefined) {
  const candidate = value?.trim()
  if (!candidate) throw new NotificationConfigurationError()
  return candidate
}

export function getWebPushConfig(
  environment: NotificationEnvironment = process.env,
): WebPushConfig {
  return {
    vapidPrivateKey: required(environment.VAPID_PRIVATE_KEY),
    vapidPublicKey: required(environment.VAPID_PUBLIC_KEY),
    vapidSubject: required(environment.VAPID_SUBJECT),
  }
}

function buildPayload(notification: ClaimedNotification) {
  if (notification.type === 'schedule_opened') {
    return JSON.stringify({
      body: '새로운 스케줄 신청 기간이 열렸습니다.',
      title: `일정 신청 오픈 - ${notification.recipientName}`,
      type: notification.type,
    })
  }
  const variables = getNotificationTemplateVariables({
    endTime: notification.endTime ?? '',
    recipientName: notification.recipientName,
    startTime: notification.startTime ?? '',
    type: notification.type,
    workDate: notification.workDate ?? '',
  })
  const titles: Record<string, string> = {
    schedule_cancelled: '일정 취소',
    schedule_changed: '일정 변경',
    schedule_confirmed: '일정 확정',
  }
  return JSON.stringify({
    body: `${variables.workDate} ${variables.startTime}~${variables.endTime}`,
    title: `${titles[notification.type] ?? '알림'} - ${variables.recipientName}`,
    type: notification.type,
  })
}

export function createWebPushSender(config: WebPushConfig): NotificationSender {
  webpush.setVapidDetails(config.vapidSubject, config.vapidPublicKey, config.vapidPrivateKey)
  return {
    async send(notification) {
      const payload = buildPayload(notification)
      const subscriptions = notification.subscriptions
      if (!subscriptions || subscriptions.length === 0) {
        return {
          errorCode: 'NO_SUBSCRIPTIONS',
          failureReason: 'Recipient has no push subscriptions.',
          isTransient: false,
          ok: false,
        }
      }
      let lastProviderMessageId = ''
      for (const sub of subscriptions) {
        try {
          const result = await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { auth: sub.keyAuth, p256dh: sub.keyP256dh },
            },
            payload,
            { TTL: 86400 },
          )
          lastProviderMessageId = result.headers?.location ?? `push-${Date.now()}`
        } catch (error: unknown) {
          const statusCode = error instanceof webpush.WebPushError ? error.statusCode : undefined
          if (statusCode === 404 || statusCode === 410) {
            continue
          }
          if (statusCode && statusCode >= 500) {
            return {
              errorCode: `PROVIDER_HTTP_${statusCode}`,
              failureReason: 'Push service returned a transient error.',
              isTransient: true,
              ok: false,
            }
          }
          return {
            errorCode: statusCode ? `PROVIDER_HTTP_${statusCode}` : 'PROVIDER_NETWORK_ERROR',
            failureReason: 'Push delivery failed.',
            isTransient: !statusCode || statusCode >= 500,
            ok: false,
          }
        }
      }
      if (!lastProviderMessageId) {
        return {
          errorCode: 'ALL_SUBSCRIPTIONS_EXPIRED',
          failureReason: 'All push subscriptions have expired.',
          isTransient: false,
          ok: false,
        }
      }
      return { ok: true, providerMessageId: lastProviderMessageId }
    },
  }
}
