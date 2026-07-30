import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  createKakaoAlimtalkSender,
  getKakaoAlimtalkConfig,
  type KakaoAlimtalkConfig,
} from './kakao-alimtalk-adapter'

const notification = {
  endTime: '18:00:00',
  leaseToken: '8cf0ac26-ea5a-438b-8c68-caf84c52ff39',
  notificationId: 'e2308f73-a094-4dd1-8505-e216d5c4fc68',
  recipientName: '라비',
  recipientPhone: '01012345678',
  startTime: '09:00:00',
  type: 'schedule_confirmed' as const,
  workDate: '2026-08-01',
}

const config: KakaoAlimtalkConfig = {
  apiKey: 'test-secret',
  apiUrl: 'https://provider.example/messages',
  senderKey: 'sender',
  templateCodes: {
    schedule_cancelled: 'cancelled',
    schedule_changed: 'changed',
    schedule_confirmed: 'confirmed',
  },
  timeoutMs: 1000,
}

describe('Kakao Alimtalk adapter', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('uses the documented request and parses a safe success response', async () => {
    const providerFetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ messageId: 'provider-1', success: true }), {
        status: 200,
      }),
    )
    const result = await createKakaoAlimtalkSender(config, providerFetch).send(notification)
    expect(result).toEqual({ ok: true, providerMessageId: 'provider-1' })
    expect(providerFetch).toHaveBeenCalledWith(
      config.apiUrl,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-secret',
          'X-Idempotency-Key': notification.notificationId,
        }),
        method: 'POST',
      }),
    )
  })

  it('classifies throttling as transient without persisting a raw message', async () => {
    const providerFetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: 'rate limited', message: 'raw provider detail' },
          success: false,
        }),
        { status: 429 },
      ),
    )
    expect(await createKakaoAlimtalkSender(config, providerFetch).send(notification)).toEqual({
      errorCode: 'RATE_LIMITED',
      failureReason: 'Provider returned a transient delivery error.',
      isTransient: true,
      ok: false,
    })
  })

  it('classifies a normal client rejection as permanent', async () => {
    const providerFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('{}', { status: 400 }))
    expect(await createKakaoAlimtalkSender(config, providerFetch).send(notification)).toEqual({
      errorCode: 'PROVIDER_HTTP_400',
      failureReason: 'Provider rejected the delivery request.',
      isTransient: false,
      ok: false,
    })
  })

  it('aborts a slow provider request and returns a safe transient timeout', async () => {
    const providerFetch = vi.fn<typeof fetch>().mockImplementation(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          )
        }),
    )
    const sender = createKakaoAlimtalkSender({ ...config, timeoutMs: 1 }, providerFetch)
    await expect(sender.send(notification)).resolves.toEqual({
      errorCode: 'PROVIDER_TIMEOUT',
      failureReason: 'Provider request timed out.',
      isTransient: true,
      ok: false,
    })
  })

  it('fails closed when a template secret is missing', () => {
    expect(() =>
      getKakaoAlimtalkConfig({
        KAKAO_ALIMTALK_API_KEY: 'key',
        KAKAO_ALIMTALK_API_URL: 'https://provider.example/messages',
        KAKAO_ALIMTALK_SENDER_KEY: 'sender',
      }),
    ).toThrow('NOTIFICATION_CONFIGURATION_MISSING')
  })
})
