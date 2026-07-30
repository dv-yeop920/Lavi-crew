import 'server-only'

import {
  getNotificationTemplateVariables,
  isTransientProviderStatus,
  type NotificationDeliveryResult,
  sanitizeProviderErrorCode,
} from '../domain/notification-delivery'
import {
  type ClaimedNotification,
  type NotificationType,
  providerFailureResponseSchema,
  providerSuccessResponseSchema,
} from '../schemas/notification'

export type KakaoAlimtalkConfig = {
  apiKey: string
  apiUrl: string
  senderKey: string
  templateCodes: Record<NotificationType, string>
  timeoutMs: number
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

export function getKakaoAlimtalkConfig(
  environment: NotificationEnvironment = process.env,
): KakaoAlimtalkConfig {
  const apiUrl = required(environment.KAKAO_ALIMTALK_API_URL)
  try {
    const url = new URL(apiUrl)
    if (url.protocol !== 'https:') throw new NotificationConfigurationError()
  } catch {
    throw new NotificationConfigurationError()
  }
  const parsedTimeout = Number(environment.KAKAO_ALIMTALK_TIMEOUT_MS ?? '5000')
  if (!Number.isInteger(parsedTimeout) || parsedTimeout < 1000 || parsedTimeout > 15000)
    throw new NotificationConfigurationError()
  return {
    apiKey: required(environment.KAKAO_ALIMTALK_API_KEY),
    apiUrl,
    senderKey: required(environment.KAKAO_ALIMTALK_SENDER_KEY),
    templateCodes: {
      schedule_cancelled: required(environment.KAKAO_ALIMTALK_TEMPLATE_SCHEDULE_CANCELLED),
      schedule_changed: required(environment.KAKAO_ALIMTALK_TEMPLATE_SCHEDULE_CHANGED),
      schedule_confirmed: required(environment.KAKAO_ALIMTALK_TEMPLATE_SCHEDULE_CONFIRMED),
    },
    timeoutMs: parsedTimeout,
  }
}

async function parseResponseBody(response: Response) {
  const body = await response.text()
  if (body.length > 16_384) return null
  try {
    return JSON.parse(body) as unknown
  } catch {
    return null
  }
}

export function createKakaoAlimtalkSender(
  config: KakaoAlimtalkConfig,
  fetchImplementation: typeof fetch = fetch,
): NotificationSender {
  return {
    async send(notification) {
      const abortController = new AbortController()
      const timeout = setTimeout(() => abortController.abort(), config.timeoutMs)
      try {
        const response = await fetchImplementation(config.apiUrl, {
          body: JSON.stringify({
            recipientPhone: notification.recipientPhone,
            requestId: notification.notificationId,
            senderKey: config.senderKey,
            templateCode: config.templateCodes[notification.type],
            variables: getNotificationTemplateVariables(notification),
          }),
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': notification.notificationId,
          },
          method: 'POST',
          signal: abortController.signal,
        })
        const body = await parseResponseBody(response)
        if (response.ok) {
          const parsed = providerSuccessResponseSchema.safeParse(body)
          return parsed.success
            ? { ok: true, providerMessageId: parsed.data.messageId }
            : {
                errorCode: 'PROVIDER_INVALID_RESPONSE',
                failureReason: 'Provider returned an invalid success response.',
                isTransient: true,
                ok: false,
              }
        }
        const parsedFailure = providerFailureResponseSchema.safeParse(body)
        const isTransient =
          isTransientProviderStatus(response.status) ||
          (parsedFailure.success && parsedFailure.data.error?.retryable === true)
        return {
          errorCode: sanitizeProviderErrorCode(
            parsedFailure.success ? parsedFailure.data.error?.code : undefined,
            `PROVIDER_HTTP_${response.status}`,
          ),
          failureReason: isTransient
            ? 'Provider returned a transient delivery error.'
            : 'Provider rejected the delivery request.',
          isTransient,
          ok: false,
        }
      } catch {
        return {
          errorCode: abortController.signal.aborted ? 'PROVIDER_TIMEOUT' : 'PROVIDER_NETWORK_ERROR',
          failureReason: abortController.signal.aborted
            ? 'Provider request timed out.'
            : 'Provider network request failed.',
          isTransient: true,
          ok: false,
        }
      } finally {
        clearTimeout(timeout)
      }
    },
  }
}
