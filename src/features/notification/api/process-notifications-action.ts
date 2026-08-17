'use server'

import {
  isNotificationConfigurationError,
  type NotificationProcessorSummary,
  processNotificationsController,
} from '../model/notification-controller'

export type ProcessNotificationsResult =
  | { code: 'PROCESSOR_NOT_CONFIGURED' | 'PROCESSOR_FAILED'; ok: false }
  | { ok: true; summary: NotificationProcessorSummary }

export async function processNotificationsAction(): Promise<ProcessNotificationsResult> {
  try {
    const summary = await processNotificationsController()
    return { ok: true, summary }
  } catch (error) {
    if (isNotificationConfigurationError(error)) {
      return { code: 'PROCESSOR_NOT_CONFIGURED', ok: false }
    }
    return { code: 'PROCESSOR_FAILED', ok: false }
  }
}
