import { describe, expect, it } from 'vitest'

import {
  mapSignupFailure,
  mapSignupIdentityAvailability,
  repeatedSignupFailure,
} from './auth-error'

describe('auth error mapping', () => {
  it('maps weak passwords to the password field', () => {
    const result = mapSignupFailure({ code: 'weak_password' })
    expect(result.code).toBe('WEAK_PASSWORD')
    expect(result.fieldErrors?.password?.[0]).toContain('안전한 비밀번호')
  })

  it('preserves form values for an ambiguous profile trigger race', () => {
    const result = mapSignupFailure({ message: 'Database error saving new user' })
    expect(result.code).toBe('PROFILE_CREATE_FAILED')
    expect(result.fieldErrors).toBeUndefined()
  })

  it('maps every unavailable signup identity field precisely', () => {
    const result = mapSignupIdentityAvailability({
      is_invite_code_valid: false,
      is_name_available: false,
      is_phone_available: false,
    })

    expect(result?.fieldErrors?.name).toEqual(['이미 등록된 이름입니다.'])
    expect(result?.fieldErrors?.phone).toEqual(['이미 등록된 휴대폰 번호입니다.'])
    expect(result?.fieldErrors?.inviteCode).toEqual(['라비에벨 전용 코드가 올바르지 않습니다.'])
  })

  it('allows signup when all identity checks pass', () => {
    expect(
      mapSignupIdentityAvailability({
        is_invite_code_valid: true,
        is_name_available: true,
        is_phone_available: true,
      }),
    ).toBeNull()
  })

  it('does not state that an obfuscated repeated signup definitely exists', () => {
    const result = repeatedSignupFailure()
    expect(result.fieldErrors?.email?.[0]).toContain('이미 가입한 이메일이라면')
  })
})
