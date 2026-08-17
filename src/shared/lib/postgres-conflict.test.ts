import { describe, expect, it } from 'vitest'

import { getProfileUniqueConflict } from './postgres-conflict'

describe('getProfileUniqueConflict', () => {
  it('distinguishes normalized-name and phone conflicts', () => {
    expect(
      getProfileUniqueConflict({
        code: '23505',
        message: 'profiles_name_normalized_unique_idx',
      }),
    ).toBe('name')
    expect(getProfileUniqueConflict({ code: '23505', details: 'profiles_phone_key' })).toBe('phone')
  })

  it('does not misclassify unrelated database errors', () => {
    expect(getProfileUniqueConflict({ code: '40001', message: 'stale' })).toBeNull()
    expect(getProfileUniqueConflict({ code: '23505', message: 'another_unique_key' })).toBeNull()
  })
})
