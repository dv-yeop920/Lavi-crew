import { describe, expect, it } from 'vitest'

import { createInviteCodeFromRequestId } from './invite-code'

describe('createInviteCodeFromRequestId', () => {
  it('returns the same invite code when an idempotent request is retried', () => {
    const requestId = '40000000-0000-4000-8000-000000000013'

    expect(createInviteCodeFromRequestId(requestId)).toBe('LAVI-400000000000')
    expect(createInviteCodeFromRequestId(requestId)).toBe(createInviteCodeFromRequestId(requestId))
  })

  it('creates a fixed-format code from a different request id', () => {
    expect(createInviteCodeFromRequestId('a1b2c3d4-e5f6-4789-8abc-def012345678')).toMatch(
      /^LAVI-[0-9A-F]{12}$/,
    )
  })
})
