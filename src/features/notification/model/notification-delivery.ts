import type { NotificationType } from '../schema/notification'

export type NotificationDeliveryFailure = {
  errorCode: string
  failureReason: string
  isTransient: boolean
  ok: false
}

export type NotificationDeliveryResult =
  | {
      ok: true
      providerMessageId: string
    }
  | NotificationDeliveryFailure

const transientStatuses = new Set([408, 425, 429])

export function isTransientProviderStatus(status: number) {
  return transientStatuses.has(status) || status >= 500
}

export function sanitizeProviderErrorCode(value: string | undefined, fallback: string) {
  const sanitized = value
    ?.trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_:-]/g, '_')
    .slice(0, 64)
  return sanitized || fallback
}

export function getNotificationTemplateVariables(input: {
  endTime: string
  recipientName: string
  startTime: string
  type: NotificationType
  workDate: string
}) {
  return {
    endTime: input.endTime.slice(0, 5),
    recipientName: input.recipientName,
    startTime: input.startTime.slice(0, 5),
    type: input.type,
    workDate: input.workDate,
  }
}

export function getExpiredLeaseRecovery(input: {
  asOf: Date
  attemptCount: number
  lockedUntil: string | null
  status: 'failed' | 'pending' | 'sent'
}) {
  const leaseExpired = !input.lockedUntil || new Date(input.lockedUntil) <= input.asOf
  if (input.status !== 'pending' || input.attemptCount < 3 || !leaseExpired) return null
  return {
    errorCode: 'ERROR_RETRY_EXHAUSTED',
    failureReason: 'Notification retry limit was exhausted.',
    status: 'failed' as const,
  }
}
