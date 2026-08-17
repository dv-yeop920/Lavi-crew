import { describe, expect, it } from 'vitest'

import { formatScheduleWorkerSummary } from './schedule-worker-summary'

describe('formatScheduleWorkerSummary', () => {
  it('uses up to three allowed positions for stable demo history when there are no assignments', () => {
    expect(formatScheduleWorkerSummary([], ['dress', 'manager', 'song'])).toBe(
      '지난달: 드레스 3회, 매니저 2회, 축가 1회',
    )
  })

  it('prefers actual previous assignment history', () => {
    expect(
      formatScheduleWorkerSummary(
        [{ position_id: 'dress' }, { position_id: 'manager' }, { position_id: 'manager' }],
        ['song'],
      ),
    ).toBe('지난달: 드레스 1회, 매니저 2회')
  })
})
