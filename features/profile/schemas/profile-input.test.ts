import { describe, expect, it } from 'vitest'

import { parseProfileUpdate } from './profile-input'

describe('profile input parser', () => {
  it('normalizes a formatted Korean phone number', () => {
    const input = new FormData()
    input.set('name', '홍길동')
    input.set('phone', '010-1234-5678')
    input.set('kakaoConsent', 'on')
    expect(parseProfileUpdate(input)).toEqual({
      kakaoConsent: true,
      name: '홍길동',
      phone: '01012345678',
    })
  })

  it('rejects malformed names and phone numbers', () => {
    const input = new FormData()
    input.set('name', '홍')
    input.set('phone', '123')
    expect(parseProfileUpdate(input)).toBeNull()
  })
})
