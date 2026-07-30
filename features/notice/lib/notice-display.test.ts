import { describe, expect, it } from 'vitest'

import { formatNoticeDate } from './notice-display'

describe('notice display', () => {
  it('formats timestamps in Korea and handles invalid legacy values', () => {
    expect(formatNoticeDate('2026-07-30T15:30:00Z')).toBe('2026년 7월 31일')
    expect(formatNoticeDate('invalid')).toBe('날짜 확인 필요')
  })
})
