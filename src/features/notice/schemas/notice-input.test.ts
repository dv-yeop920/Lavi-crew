import { describe, expect, it } from 'vitest'

import {
  createNoticeSchema,
  deleteNoticeSchema,
  markNoticeReadSchema,
  updateNoticeSchema,
} from './notice-input'

const id = 'e2308f73-a094-4dd1-8505-e216d5c4fc68'
const version = '2026-07-30T00:00:00.000Z'

describe('notice input schemas', () => {
  it('trims and accepts a valid create request', () => {
    expect(
      createNoticeSchema.parse({
        content: '  본문  ',
        isPinned: true,
        requestId: id,
        title: '  제목  ',
      }),
    ).toMatchObject({ content: '본문', title: '제목' })
  })

  it('requires the current version for update and delete', () => {
    expect(
      updateNoticeSchema.safeParse({
        content: '본문',
        isPinned: false,
        noticeId: id,
        requestId: id,
        title: '제목',
      }).success,
    ).toBe(false)
    expect(
      deleteNoticeSchema.safeParse({
        expectedUpdatedAt: version,
        noticeId: id,
        requestId: id,
      }).success,
    ).toBe(true)
  })

  it('rejects an invalid read request id', () => {
    expect(markNoticeReadSchema.safeParse({ noticeId: id, requestId: 'retry' }).success).toBe(false)
  })
})
