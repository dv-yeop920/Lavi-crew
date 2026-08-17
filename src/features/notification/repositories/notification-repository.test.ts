import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/shared/supabase/service-role', () => ({
  createServiceRoleSupabaseClient: vi.fn(),
}))

import { createNotificationRepository, type NotificationRpcClient } from './notification-repository'

const claimed = {
  endTime: '18:00:00',
  leaseToken: '8cf0ac26-ea5a-438b-8c68-caf84c52ff39',
  notificationId: 'e2308f73-a094-4dd1-8505-e216d5c4fc68',
  recipientName: '라비',
  startTime: '09:00:00',
  subscriptions: [
    { endpoint: 'https://push.example/sub1', keyAuth: 'auth-key', keyP256dh: 'p256dh-key' },
  ],
  type: 'schedule_confirmed',
  workDate: '2026-08-01',
}

describe('notification repository RPC contract', () => {
  it('claims through the bounded service RPC and validates its payload', async () => {
    const rpc = vi.fn<NotificationRpcClient['rpc']>().mockResolvedValue({
      data: [claimed],
      error: null,
    })
    const result = await createNotificationRepository({ rpc }).claim(20, 60)
    expect(result).toEqual([claimed])
    expect(rpc).toHaveBeenCalledWith('claim_pending_notifications', {
      p_batch_size: 20,
      p_lease_seconds: 60,
    })
  })

  it('rejects malformed privileged RPC payloads', async () => {
    const rpc = vi.fn<NotificationRpcClient['rpc']>().mockResolvedValue({
      data: [{ ...claimed, subscriptions: [] }],
      error: null,
    })
    await expect(createNotificationRepository({ rpc }).claim(20, 60)).rejects.toThrow(
      'NOTIFICATION_CLAIM_RESPONSE_INVALID',
    )
  })
})
