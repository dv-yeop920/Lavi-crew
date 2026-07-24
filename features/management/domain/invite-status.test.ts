import { describe, expect, it } from 'vitest'

import { getInviteStatus } from './invite-status'

const activeInvite = {
  expiresAt: '2026-08-01T00:00:00.000Z',
  isActive: true,
  maxUses: 3,
  usedCount: 1,
}

describe('invite status', () => {
  const asOf = new Date('2026-07-24T00:00:00.000Z')

  it('prioritizes an explicitly disabled code', () => {
    expect(getInviteStatus({ ...activeInvite, isActive: false }, asOf)).toBe('disabled')
  })

  it('marks a code with no remaining uses as exhausted', () => {
    expect(getInviteStatus({ ...activeInvite, usedCount: 3 }, asOf)).toBe('exhausted')
  })

  it('marks a code at its expiry instant as expired', () => {
    expect(getInviteStatus({ ...activeInvite, expiresAt: asOf.toISOString() }, asOf)).toBe(
      'expired',
    )
  })

  it('keeps an available code active', () => {
    expect(getInviteStatus(activeInvite, asOf)).toBe('active')
  })
})
