import 'server-only'

import {
  createServiceRoleNotificationRepository,
  type NotificationRepository,
} from '../api/notification-repository'
import {
  createWebPushSender,
  getWebPushConfig,
  NotificationConfigurationError,
  type NotificationEnvironment,
  type NotificationSender,
} from '../api/web-push-adapter'

export type NotificationProcessorSummary = {
  claimed: number
  errors: number
  failed: number
  retried: number
  sent: number
}

async function processClaimedNotification(input: {
  notification: Awaited<ReturnType<NotificationRepository['claim']>>[number]
  repository: NotificationRepository
  sender: NotificationSender
}) {
  try {
    let delivery
    try {
      delivery = await input.sender.send(input.notification)
    } catch {
      delivery = {
        errorCode: 'ADAPTER_UNEXPECTED_ERROR',
        failureReason: 'Notification adapter failed unexpectedly.',
        isTransient: true,
        ok: false as const,
      }
    }
    if (delivery.ok) {
      await input.repository.complete({
        leaseToken: input.notification.leaseToken,
        notificationId: input.notification.notificationId,
        providerMessageId: delivery.providerMessageId,
      })
      return 'sent' as const
    }
    const result = await input.repository.retryOrFail({
      errorCode: delivery.errorCode,
      failureReason: delivery.failureReason,
      isTransient: delivery.isTransient,
      leaseToken: input.notification.leaseToken,
      notificationId: input.notification.notificationId,
    })
    return result.status === 'pending' ? ('retried' as const) : ('failed' as const)
  } catch {
    return 'error' as const
  }
}

export async function processNotificationBatch(input: {
  batchSize: number
  leaseSeconds: number
  repository: NotificationRepository
  sender: NotificationSender
}): Promise<NotificationProcessorSummary> {
  const notifications = await input.repository.claim(input.batchSize, input.leaseSeconds)
  const summary: NotificationProcessorSummary = {
    claimed: notifications.length,
    errors: 0,
    failed: 0,
    retried: 0,
    sent: 0,
  }
  const outcomes = await Promise.all(
    notifications.map((notification) =>
      processClaimedNotification({
        notification,
        repository: input.repository,
        sender: input.sender,
      }),
    ),
  )
  for (const outcome of outcomes) {
    if (outcome === 'error') summary.errors += 1
    else summary[outcome] += 1
  }
  return summary
}

function processorInteger(
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  const parsed = Number(value ?? fallback)
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum)
    throw new NotificationConfigurationError()
  return parsed
}

export function getNotificationProcessorConfig(environment: NotificationEnvironment = process.env) {
  if (!environment.NEXT_PUBLIC_SUPABASE_URL || !environment.SUPABASE_SERVICE_ROLE_KEY)
    throw new NotificationConfigurationError()
  const provider = getWebPushConfig(environment)
  const batchSize = processorInteger(environment.NOTIFICATION_BATCH_SIZE, 5, 1, 5)
  const leaseSeconds = processorInteger(environment.NOTIFICATION_LEASE_SECONDS, 60, 60, 300)
  return { batchSize, leaseSeconds, provider }
}

export async function processNotificationsController(
  environment: NotificationEnvironment = process.env,
) {
  const config = getNotificationProcessorConfig(environment)
  const sender = createWebPushSender(config.provider)
  const repository = createServiceRoleNotificationRepository()
  return processNotificationBatch({
    batchSize: config.batchSize,
    leaseSeconds: config.leaseSeconds,
    repository,
    sender,
  })
}

export function isNotificationConfigurationError(
  error: unknown,
): error is NotificationConfigurationError {
  return error instanceof NotificationConfigurationError
}
