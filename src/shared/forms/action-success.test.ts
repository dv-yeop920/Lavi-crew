import { describe, expect, it } from 'vitest'

import { isNewSuccessfulActionResult } from './action-success'

describe('action success result identity', () => {
  it('handles two consecutive successful action result objects', () => {
    const first = { message: 'first', ok: true }
    const second = { message: 'second', ok: true }

    expect(isNewSuccessfulActionResult(null, first)).toBe(true)
    expect(isNewSuccessfulActionResult(first, second)).toBe(true)
  })

  it('does not handle the same result twice or a failed result', () => {
    const success = { ok: true }
    expect(isNewSuccessfulActionResult(success, success)).toBe(false)
    expect(isNewSuccessfulActionResult(success, { ok: false })).toBe(false)
  })
})
