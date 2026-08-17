import { describe, expect, it } from 'vitest'

import { POSITION_CATALOG } from './positions'

describe('fixed position catalog', () => {
  it('contains only the eight confirmed positions', () => {
    expect(POSITION_CATALOG.map((position) => position.name)).toEqual([
      '팀장',
      '스캔',
      '메인',
      '드레스',
      '축가',
      '매니저',
      '안내',
      '대기실',
    ])
  })

  it('uses two default people only for manager and guide', () => {
    expect(
      POSITION_CATALOG.filter((position) => position.defaultAssigneeCount === 2).map(
        (position) => position.name,
      ),
    ).toEqual(['매니저', '안내'])
    expect(
      POSITION_CATALOG.every((position) => [1, 2].includes(position.defaultAssigneeCount)),
    ).toBe(true)
  })
})
