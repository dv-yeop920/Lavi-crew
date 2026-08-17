import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { parseInviteCreate, parseUuid, parseWorkerUpdate } from './management-input'

describe('management action parsers', () => {
  it('accepts known positions and rejects invalid worker input', () => {
    const asOf = new Date('2026-08-04T00:00:00+09:00')
    const valid = new FormData()
    valid.set('name', '김민지')
    valid.set('hourlyWage', '13000')
    valid.set('hiredAt', '2026-08-01')
    valid.append('positionIds', 'main')
    const parsed = parseWorkerUpdate(valid, asOf)
    expect(parsed.success).toBe(true)
    if (!parsed.success) return
    expect(parsed.data.positionIds).toEqual(['main'])

    valid.append('positionIds', 'unknown position')
    expect(parseWorkerUpdate(valid, asOf).success).toBe(false)
  })

  it('rejects a future hired date for worker updates', () => {
    const asOf = new Date('2026-08-04T00:00:00+09:00')
    const valid = new FormData()
    valid.set('name', '김민지')
    valid.set('hourlyWage', '13000')
    valid.set('hiredAt', '2026-08-05')
    valid.append('positionIds', 'main')
    const parsed = parseWorkerUpdate(valid, asOf)
    expect(parsed.success).toBe(false)
    if (parsed.success) return
    expect(z.flattenError(parsed.error).fieldErrors.hiredAt?.[0]).toBe(
      '입사일은 오늘 이전 날짜여야 합니다.',
    )
  })

  it('normalizes invite codes and rejects invalid limits', () => {
    const input = new FormData()
    input.set('label', '여름 신규 크루')
    input.set('expiresAt', '2026-08-31')
    input.set('maxUses', '10')
    const asOf = new Date('2026-07-24T00:00:00Z')
    const parsed = parseInviteCreate(input, asOf)
    expect(parsed.success).toBe(true)
    if (!parsed.success) return
    expect(parsed.data).toMatchObject({ maxUses: 10 })
    input.set('maxUses', '0')
    expect(parseInviteCreate(input, asOf).success).toBe(false)
  })

  it('rejects invalid and past invite expiry dates', () => {
    const input = new FormData()
    input.set('label', '신규 크루')
    input.set('expiresAt', '2026-02-31')
    input.set('maxUses', '10')
    expect(parseInviteCreate(input, new Date('2026-01-01T00:00:00Z')).success).toBe(false)

    input.set('expiresAt', '2026-07-23')
    expect(parseInviteCreate(input, new Date('2026-07-24T00:00:00Z')).success).toBe(false)
  })

  it('accepts only canonical UUID-shaped identifiers', () => {
    expect(parseUuid('7b1223aa-b2bd-4ff1-a213-52f17edb752d').success).toBe(true)
    expect(parseUuid('worker').success).toBe(false)
  })
})
