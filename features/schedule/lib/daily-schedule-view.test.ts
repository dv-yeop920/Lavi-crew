import { describe, expect, it } from 'vitest'

import {
  createDailyPositionDrafts,
  toKoreanDateTimeInput,
  toKoreanIso,
} from './daily-schedule-view'

describe('daily schedule view adapters', () => {
  it('maps flat assignments into the shared position table without losing slot order', () => {
    const drafts = createDailyPositionDrafts([
      {
        attendance: null,
        id: 'cancelled-old',
        isTraining: false,
        positionId: 'leader',
        slotIndex: 0,
        status: 'cancelled',
        workerId: 'old-worker',
      },
      {
        attendance: null,
        id: 'assignment-2',
        isTraining: true,
        positionId: 'leader',
        slotIndex: 1,
        status: 'confirmed',
        workerId: 'worker-2',
      },
      {
        attendance: null,
        id: 'assignment-1',
        isTraining: false,
        positionId: 'leader',
        slotIndex: 0,
        status: 'confirmed',
        workerId: 'worker-1',
      },
    ])
    expect(drafts[0].assignedWorkerIds).toEqual(['worker-1', 'worker-2'])
    expect(drafts[0].trainingFlags).toEqual([false, true])
  })

  it('round-trips datetime-local values through Asia/Seoul', () => {
    expect(toKoreanIso('2026-08-01T09:30')).toBe('2026-08-01T00:30:00.000Z')
    expect(toKoreanDateTimeInput('2026-08-01T00:30:00.000Z')).toBe('2026-08-01T09:30')
  })
})
