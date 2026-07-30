import { describe, expect, it } from 'vitest'

import { getWorkerAvailabilityLabel, isWorkerOptionDisabled } from './schedule-worker-option'

describe('schedule worker option availability', () => {
  const inactiveWorker = { id: 'inactive', isActive: false, isSelectable: false }

  it('keeps an existing inactive assignee visible but prevents new selection', () => {
    expect(isWorkerOptionDisabled(inactiveWorker, 'inactive', new Set())).toBe(false)
    expect(isWorkerOptionDisabled(inactiveWorker, 'other', new Set())).toBe(true)
    expect(getWorkerAvailabilityLabel(inactiveWorker)).toBe('비활성 · 신규 선택 불가')
  })

  it('prevents selecting an active worker without a configured wage', () => {
    const wageMissing = { id: 'worker', isActive: true, isSelectable: false }
    expect(isWorkerOptionDisabled(wageMissing, '', new Set())).toBe(true)
    expect(getWorkerAvailabilityLabel(wageMissing)).toBe('시급 미설정 · 신규 선택 불가')
  })
})
