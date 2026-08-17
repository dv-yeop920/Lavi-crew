import { describe, expect, it } from 'vitest'

import { getNoticeMutationError } from './notice-mutation-error'

describe('notice mutation errors', () => {
  it('maps stable RPC codes without leaking database details', () => {
    expect(getNoticeMutationError('P0001: STALE_NOTICE in public.update_notice')).toEqual({
      code: 'STALE_NOTICE',
      message: '공지가 변경되었습니다. 최신 상태를 다시 불러와 주세요.',
    })
  })

  it('uses a safe fallback for unknown database errors', () => {
    expect(getNoticeMutationError('sensitive database detail')).toEqual({
      code: 'NOTICE_SAVE_FAILED',
      message: '공지를 저장하지 못했습니다.',
    })
  })
})
