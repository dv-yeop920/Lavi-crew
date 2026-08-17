import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/shared/supabase/service-role', () => ({
  createServiceRoleSupabaseClient: vi.fn(),
}))

import type { NotificationSender } from '../adapters/web-push-adapter'
import type { NotificationRepository } from '../repositories/notification-repository'

import {
  getNotificationProcessorConfig,
  processNotificationBatch,
  processNotificationsController,
} from './notification-controller'

const notifications = [
  {
    endTime: '18:00:00',
    leaseToken: '8cf0ac26-ea5a-438b-8c68-caf84c52ff39',
    notificationId: 'e2308f73-a094-4dd1-8505-e216d5c4fc68',
    recipientName: '라비',
    startTime: '09:00:00',
    subscriptions: [
      { endpoint: 'https://push.example/a', keyAuth: 'auth-a', keyP256dh: 'p256dh-a' },
    ],
    type: 'schedule_confirmed' as const,
    workDate: '2026-08-01',
  },
  {
    endTime: '19:00:00',
    leaseToken: '214f8bc4-6067-4113-b5ab-11e63063c4b5',
    notificationId: '4ea7c8b3-ea85-45d2-aec5-c257b674a88c',
    recipientName: '크루',
    startTime: '10:00:00',
    subscriptions: [
      { endpoint: 'https://push.example/b', keyAuth: 'auth-b', keyP256dh: 'p256dh-b' },
    ],
    type: 'schedule_changed' as const,
    workDate: '2026-08-02',
  },
]

const configuredEnvironment = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  VAPID_PRIVATE_KEY: 'private-key',
  VAPID_PUBLIC_KEY: 'public-key',
  VAPID_SUBJECT: 'mailto:admin@example.com',
}

describe('notification processor controller', () => {
  it('fails before claiming when server-only configuration is missing', async () => {
    await expect(processNotificationsController({})).rejects.toThrow(
      'NOTIFICATION_CONFIGURATION_MISSING',
    )
  })

  it('enforces processor batch and lease bounds', () => {
    expect(getNotificationProcessorConfig(configuredEnvironment)).toMatchObject({
      batchSize: 5,
      leaseSeconds: 60,
    })
    expect(() =>
      getNotificationProcessorConfig({
        ...configuredEnvironment,
        NOTIFICATION_BATCH_SIZE: '6',
      }),
    ).toThrow('NOTIFICATION_CONFIGURATION_MISSING')
    expect(() =>
      getNotificationProcessorConfig({
        ...configuredEnvironment,
        NOTIFICATION_LEASE_SECONDS: '59',
      }),
    ).toThrow('NOTIFICATION_CONFIGURATION_MISSING')
    expect(() =>
      getNotificationProcessorConfig({
        ...configuredEnvironment,
        NOTIFICATION_LEASE_SECONDS: '301',
      }),
    ).toThrow('NOTIFICATION_CONFIGURATION_MISSING')
  })

  it('completes successes and schedules transient failures without exposing records', async () => {
    const repository = {
      claim: vi.fn().mockResolvedValue(notifications),
      complete: vi.fn().mockResolvedValue(undefined),
      retryOrFail: vi.fn().mockResolvedValue({
        attemptCount: 1,
        nextAttemptAt: '2026-07-30T00:01:00Z',
        notificationId: notifications[1].notificationId,
        status: 'pending',
      }),
    } as unknown as NotificationRepository
    const sender = {
      send: vi
        .fn()
        .mockResolvedValueOnce({ ok: true, providerMessageId: 'provider-1' })
        .mockResolvedValueOnce({
          errorCode: 'PROVIDER_TIMEOUT',
          failureReason: 'Provider request timed out.',
          isTransient: true,
          ok: false,
        }),
    } as NotificationSender
    await expect(
      processNotificationBatch({
        batchSize: 5,
        leaseSeconds: 60,
        repository,
        sender,
      }),
    ).resolves.toEqual({ claimed: 2, errors: 0, failed: 0, retried: 1, sent: 1 })
    expect(repository.complete).toHaveBeenCalledTimes(1)
    expect(repository.retryOrFail).toHaveBeenCalledTimes(1)
  })

  it('isolates a lease CAS failure without aborting another claimed item', async () => {
    const repository = {
      claim: vi.fn().mockResolvedValue(notifications),
      complete: vi.fn().mockImplementation(async ({ notificationId }) => {
        if (notificationId === notifications[0].notificationId)
          throw new Error('NOTIFICATION_COMPLETE_FAILED')
      }),
      retryOrFail: vi.fn(),
    } as unknown as NotificationRepository
    const sender = {
      send: vi.fn().mockResolvedValue({ ok: true, providerMessageId: 'provider-id' }),
    } as NotificationSender
    await expect(
      processNotificationBatch({
        batchSize: 5,
        leaseSeconds: 60,
        repository,
        sender,
      }),
    ).resolves.toEqual({ claimed: 2, errors: 1, failed: 0, retried: 0, sent: 1 })
    expect(sender.send).toHaveBeenCalledTimes(2)
    expect(repository.complete).toHaveBeenCalledTimes(2)
  })
})
