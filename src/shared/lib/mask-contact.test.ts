import { describe, expect, it } from 'vitest'

import { maskEmail, maskPhone } from './mask-contact'

describe('contact masking', () => {
  it('masks email and phone without exposing the complete values', () => {
    expect(maskEmail('worker@example.com')).toBe('wo****@example.com')
    expect(maskEmail(null)).toBe('이메일 없음')
    expect(maskPhone('01012345678')).toBe('010-1234-****')
  })
})
