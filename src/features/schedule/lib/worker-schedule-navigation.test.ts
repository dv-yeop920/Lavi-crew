import { describe, expect, it } from 'vitest'

import { moveWorkerScheduleAnchor } from './worker-schedule-navigation'

describe('worker read navigation', () => {
  it('moves month anchors from day one without month-end overflow', () => {
    expect(moveWorkerScheduleAnchor('month', '2026-01-31', 1)).toBe('2026-02-01')
  })

  it('moves week and day anchors by their exact period', () => {
    expect(moveWorkerScheduleAnchor('week', '2026-08-05', 1)).toBe('2026-08-12')
    expect(moveWorkerScheduleAnchor('day', '2026-08-05', -1)).toBe('2026-08-04')
  })
})
