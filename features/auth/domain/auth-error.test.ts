import { describe, expect, it } from 'vitest'

import { mapSignupFailure, repeatedSignupFailure } from './auth-error'

describe('auth error mapping', () => {
  it('maps weak passwords to the password field', () => {
    const result = mapSignupFailure({ code: 'weak_password' })
    expect(result.code).toBe('WEAK_PASSWORD')
    expect(result.fieldErrors?.password?.[0]).toContain('안전한 비밀번호')
  })

  it('maps profile trigger failures to actionable signup fields', () => {
    const result = mapSignupFailure({ message: 'Database error saving new user' })
    expect(result.fieldErrors?.phone?.[0]).toContain('이미 등록된 번호')
    expect(result.fieldErrors?.inviteCode?.[0]).toContain('사용 가능한 전용 코드')
  })

  it('does not state that an obfuscated repeated signup definitely exists', () => {
    const result = repeatedSignupFailure()
    expect(result.fieldErrors?.email?.[0]).toContain('이미 가입한 이메일이라면')
  })
})
