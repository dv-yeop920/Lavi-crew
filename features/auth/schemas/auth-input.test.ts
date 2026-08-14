import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { parseLoginInput, parseNewPassword, parseSignupInput } from './auth-input'

function validSignupForm() {
  const formData = new FormData()
  formData.set('name', '홍길동')
  formData.set('email', 'CREW@example.com')
  formData.set('phone', '010-1234-5678')
  formData.set('password', 'password123!')
  formData.set('passwordConfirm', 'password123!')
  formData.set('inviteCode', 'lavi-crew')
  formData.set('hiredAt', '2026-08-01')
  return formData
}

const asOf = new Date('2026-08-04T00:00:00+09:00')

describe('auth Zod schemas', () => {
  it('normalizes valid signup input without trimming passwords', () => {
    const formData = validSignupForm()
    formData.set('password', ' password123! ')
    formData.set('passwordConfirm', ' password123! ')
    const parsed = parseSignupInput(formData, asOf)

    expect(parsed.success).toBe(true)
    if (!parsed.success) return
    expect(parsed.data).toMatchObject({
      email: 'crew@example.com',
      hiredAt: '2026-08-01',
      inviteCode: 'LAVI-CREW',
      password: ' password123! ',
      phone: '01012345678',
    })
  })

  it('returns detailed field errors for omitted signup values', () => {
    const parsed = parseSignupInput(new FormData(), asOf)

    expect(parsed.success).toBe(false)
    if (parsed.success) return
    const errors = z.flattenError(parsed.error).fieldErrors
    expect(errors.name?.[0]).toBe('이름을 입력해 주세요.')
    expect(errors.email?.[0]).toBe('이메일을 입력해 주세요.')
    expect(errors.phone?.[0]).toBe('휴대폰 번호를 입력해 주세요.')
    expect(errors.password?.[0]).toBe('비밀번호를 입력해 주세요.')
    expect(errors.passwordConfirm?.[0]).toBe('비밀번호 확인을 입력해 주세요.')
    expect(errors.inviteCode?.[0]).toBe('라비에벨 전용 코드를 입력해 주세요.')
    expect(errors.hiredAt?.[0]).toBe('입사일을 입력해 주세요.')
  })

  it('rejects a future hired date', () => {
    const formData = validSignupForm()
    formData.set('hiredAt', '2026-08-05')
    const parsed = parseSignupInput(formData, asOf)

    expect(parsed.success).toBe(false)
    if (parsed.success) return
    expect(z.flattenError(parsed.error).fieldErrors.hiredAt?.[0]).toBe(
      '입사일은 오늘 이전 날짜여야 합니다.',
    )
  })

  it('reports mismatched password confirmation', () => {
    const formData = validSignupForm()
    formData.set('passwordConfirm', 'different-password')
    const parsed = parseSignupInput(formData)

    expect(parsed.success).toBe(false)
    if (parsed.success) return
    expect(z.flattenError(parsed.error).fieldErrors.passwordConfirm?.[0]).toBe(
      '비밀번호와 비밀번호 확인이 일치하지 않습니다.',
    )
  })

  it('validates login and password reset inputs', () => {
    const login = new FormData()
    login.set('email', 'invalid')
    login.set('password', 'short')
    expect(parseLoginInput(login).success).toBe(false)

    const password = new FormData()
    password.set('password', 'new-password')
    password.set('passwordConfirm', 'new-password')
    expect(parseNewPassword(password).success).toBe(true)
  })
})
