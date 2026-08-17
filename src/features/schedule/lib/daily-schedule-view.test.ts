import { describe, expect, it } from 'vitest'

import { createDailyPositionDrafts } from './daily-schedule-view'

describe('daily schedule view adapters', () => {
  it('maps flat assignments into the shared position table without losing slot order', () => {
    const drafts = createDailyPositionDrafts([
      {
        id: 'cancelled-old',
        isTraining: false,
        positionId: 'leader',
        slotIndex: 0,
        status: 'cancelled',
        workerId: 'old-worker',
      },
      {
        id: 'assignment-2',
        isTraining: true,
        positionId: 'leader',
        slotIndex: 1,
        status: 'confirmed',
        workerId: 'worker-2',
      },
      {
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
})
