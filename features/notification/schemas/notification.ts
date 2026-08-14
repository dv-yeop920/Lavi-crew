import { z } from 'zod'

export const notificationTypeSchema = z.enum([
  'schedule_confirmed',
  'schedule_changed',
  'schedule_cancelled',
])

const pushSubscriptionSchema = z.object({
  endpoint: z.string().min(1),
  keyAuth: z.string().min(1),
  keyP256dh: z.string().min(1),
})

export const claimedNotificationSchema = z.object({
  endTime: z.string().min(1),
  leaseToken: z.uuid(),
  notificationId: z.uuid(),
  recipientName: z.string().trim().min(1).max(100),
  startTime: z.string().min(1),
  subscriptions: z.array(pushSubscriptionSchema).min(1),
  type: notificationTypeSchema,
  workDate: z.iso.date(),
})

export const claimedNotificationsSchema = z.array(claimedNotificationSchema)

export const retryNotificationResponseSchema = z.object({
  attemptCount: z.number().int().min(1).max(3),
  nextAttemptAt: z.string().nullable(),
  notificationId: z.uuid(),
  status: z.enum(['failed', 'pending']),
})

export const providerSuccessResponseSchema = z.object({
  messageId: z.string().trim().min(1).max(200),
  success: z.literal(true),
})

export const providerFailureResponseSchema = z.object({
  error: z
    .object({
      code: z.string().trim().min(1).max(64),
      retryable: z.boolean().optional(),
    })
    .optional(),
  success: z.literal(false),
})

export type NotificationType = z.infer<typeof notificationTypeSchema>
export type ClaimedNotification = z.infer<typeof claimedNotificationSchema>
