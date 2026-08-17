import 'server-only'

import type { Json } from '@/shared/supabase/database.types'
import { createServiceRoleSupabaseClient } from '@/shared/supabase/service-role'

import { claimedNotificationsSchema, retryNotificationResponseSchema } from '../schema/notification'

type NotificationRpcName =
  'claim_pending_notifications' | 'complete_notification' | 'retry_or_fail_notification'

export type NotificationRpcClient = {
  rpc(
    name: NotificationRpcName,
    parameters: Record<string, unknown>,
  ): Promise<{ data: Json | null; error: { message: string } | null }>
}

export type NotificationRepository = ReturnType<typeof createNotificationRepository>

export function createNotificationRepository(client: NotificationRpcClient) {
  return {
    async claim(batchSize: number, leaseSeconds: number) {
      const result = await client.rpc('claim_pending_notifications', {
        p_batch_size: batchSize,
        p_lease_seconds: leaseSeconds,
      })
      if (result.error) throw new Error('NOTIFICATION_CLAIM_FAILED')
      const parsed = claimedNotificationsSchema.safeParse(result.data)
      if (!parsed.success) throw new Error('NOTIFICATION_CLAIM_RESPONSE_INVALID')
      return parsed.data
    },
    async complete(input: {
      leaseToken: string
      notificationId: string
      providerMessageId: string
    }) {
      const result = await client.rpc('complete_notification', {
        p_lease_token: input.leaseToken,
        p_notification_id: input.notificationId,
        p_provider_message_id: input.providerMessageId,
      })
      if (result.error) throw new Error('NOTIFICATION_COMPLETE_FAILED')
    },
    async retryOrFail(input: {
      errorCode: string
      failureReason: string
      isTransient: boolean
      leaseToken: string
      notificationId: string
    }) {
      const result = await client.rpc('retry_or_fail_notification', {
        p_error_code: input.errorCode,
        p_failure_reason: input.failureReason,
        p_is_transient: input.isTransient,
        p_lease_token: input.leaseToken,
        p_notification_id: input.notificationId,
      })
      if (result.error) throw new Error('NOTIFICATION_RETRY_FAILED')
      const parsed = retryNotificationResponseSchema.safeParse(result.data)
      if (!parsed.success) throw new Error('NOTIFICATION_RETRY_RESPONSE_INVALID')
      return parsed.data
    },
  }
}

export function createServiceRoleNotificationRepository() {
  return createNotificationRepository(
    createServiceRoleSupabaseClient() as unknown as NotificationRpcClient,
  )
}
