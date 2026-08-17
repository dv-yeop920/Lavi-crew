import { describe, expect, it } from 'vitest'

import { getVerifiedUserId } from './claims'

describe('verified Supabase claims', () => {
  it('accepts the verified subject without requiring non-standard JWT fields', () => {
    expect(getVerifiedUserId({ sub: 'a1c7822a-475f-431e-864b-4b3c9fa186fb' })).toBe(
      'a1c7822a-475f-431e-864b-4b3c9fa186fb',
    )
  })

  it('rejects a missing or non-string subject', () => {
    expect(getVerifiedUserId(undefined)).toBeNull()
    expect(getVerifiedUserId({ sub: 123 })).toBeNull()
  })
})
