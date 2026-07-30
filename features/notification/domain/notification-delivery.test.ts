import { describe, expect, it } from 'vitest'

import {
  getExpiredLeaseRecovery,
  getNotificationTemplateVariables,
  isTransientProviderStatus,
  sanitizeProviderErrorCode,
} from './notification-delivery'

describe('notification delivery domain', () => {
  it('terminally fails an expired third-attempt lease after a processor crash', () => {
    const asOf = new Date('2026-07-30T00:02:00Z')
    expect(
      getExpiredLeaseRecovery({
        asOf,
        attemptCount: 3,
        lockedUntil: '2026-07-30T00:01:00Z',
        status: 'pending',
      }),
    ).toEqual({
      errorCode: 'ERROR_RETRY_EXHAUSTED',
      failureReason: 'Notification retry limit was exhausted.',
      status: 'failed',
    })
    expect(
      getExpiredLeaseRecovery({
        asOf,
        attemptCount: 3,
        lockedUntil: '2026-07-30T00:03:00Z',
        status: 'pending',
      }),
    ).toBeNull()
  })

  it('classifies throttling, timeout, and server errors as transient', () => {
    expect([408, 425, 429, 500, 503].every(isTransientProviderStatus)).toBe(true)
    expect(isTransientProviderStatus(400)).toBe(false)
  })

  it('sanitizes provider error codes for bounded persistence', () => {
    expect(sanitizeProviderErrorCode(' invalid key / secret ', 'FALLBACK')).toBe(
      'INVALID_KEY___SECRET',
    )
    expect(sanitizeProviderErrorCode(undefined, 'FALLBACK')).toBe('FALLBACK')
  })

  it('uses only approved template variables and short times', () => {
    expect(
      getNotificationTemplateVariables({
        endTime: '18:30:00',
        recipientName: '라비',
        startTime: '09:00:00',
        type: 'schedule_changed',
        workDate: '2026-08-01',
      }),
    ).toEqual({
      endTime: '18:30',
      recipientName: '라비',
      startTime: '09:00',
      type: 'schedule_changed',
      workDate: '2026-08-01',
    })
  })
})
