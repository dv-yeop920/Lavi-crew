import { describe, expect, it } from 'vitest'

import { countActiveNoticeReads, sortNoticesPinnedFirst } from './notice-read-models'

describe('notice read models', () => {
  it('sorts pinned notices first and then newest first', () => {
    expect(
      sortNoticesPinnedFirst([
        { createdAt: '2026-07-30T02:00:00Z', id: 'normal-new', isPinned: false },
        { createdAt: '2026-07-29T02:00:00Z', id: 'pinned-old', isPinned: true },
        { createdAt: '2026-07-30T01:00:00Z', id: 'pinned-new', isPinned: true },
      ]).map((notice) => notice.id),
    ).toEqual(['pinned-new', 'pinned-old', 'normal-new'])
  })

  it('counts each active worker once and excludes inactive readers', () => {
    expect(countActiveNoticeReads(['active', 'active', 'inactive'], new Set(['active']))).toBe(1)
  })
})
