import { afterEach, describe, expect, it, vi } from 'vitest'

const { processNotificationsController } = vi.hoisted(() => ({
  processNotificationsController: vi.fn(),
}))

vi.mock('@/features/notification', () => ({
  isNotificationConfigurationError: () => false,
  processNotificationsController,
}))

import { POST } from './route'

const secret = 'a-secure-cron-secret-with-at-least-32-characters'

describe('internal notification processor route', () => {
  afterEach(() => {
    delete process.env.CRON_SECRET
    vi.clearAllMocks()
  })

  it('rejects unauthorized requests without calling the processor', async () => {
    process.env.CRON_SECRET = secret
    const response = await POST(
      new Request('https://lavi.example/api/internal/notifications/process', {
        headers: { Authorization: 'Bearer wrong' },
        method: 'POST',
      }),
    )
    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ code: 'UNAUTHORIZED', ok: false })
    expect(processNotificationsController).not.toHaveBeenCalled()
  })

  it('returns only aggregate processor counts', async () => {
    process.env.CRON_SECRET = secret
    processNotificationsController.mockResolvedValue({
      claimed: 2,
      errors: 0,
      failed: 0,
      retried: 1,
      sent: 1,
    })
    const response = await POST(
      new Request('https://lavi.example/api/internal/notifications/process', {
        headers: { Authorization: `Bearer ${secret}` },
        method: 'POST',
      }),
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      claimed: 2,
      errors: 0,
      failed: 0,
      ok: true,
      retried: 1,
      sent: 1,
    })
  })
})
