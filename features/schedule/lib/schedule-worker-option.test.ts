import { describe, expect, it } from 'vitest'

import {
  getWorkerApplicationLabel,
  getWorkerAvailabilityLabel,
  getWorkerOptionsForDate,
  isWorkerOptionDisabled,
} from './schedule-worker-option'

describe('schedule worker option availability', () => {
  const inactiveWorker = { id: 'inactive', isActive: false, isSelectable: false }

  it('keeps an existing inactive assignee visible but prevents new selection', () => {
    expect(isWorkerOptionDisabled(inactiveWorker, 'inactive', new Set())).toBe(false)
    expect(isWorkerOptionDisabled(inactiveWorker, 'other', new Set())).toBe(true)
    expect(getWorkerAvailabilityLabel(inactiveWorker)).toBe('비활성 · 신규 선택 불가')
  })

  it('shows only workers who applied for the selected date', () => {
    const workers = [
      { appliedDates: ['2026-08-01'], id: 'applied' },
      { appliedDates: ['2026-08-02'], id: 'other-date' },
      { appliedDates: [], id: 'not-applied' },
    ]

    expect(getWorkerOptionsForDate(workers, '2026-08-01')).toEqual([workers[0]])
    expect(getWorkerOptionsForDate(workers)).toEqual(workers)
  })

  it('keeps only the current non-applicant visible for an existing daily assignment', () => {
    const workers = [
      { appliedDates: [], id: 'existing' },
      { appliedDates: [], id: 'other-non-applicant' },
      { appliedDates: ['2026-08-01'], id: 'applicant' },
    ]

    expect(getWorkerOptionsForDate(workers, '2026-08-01', 'existing')).toEqual([
      workers[0],
      workers[2],
    ])
    expect(getWorkerApplicationLabel(workers[0], '2026-08-01', 'existing')).toBe(
      '미신청 · 기존 배정 유지 전용',
    )
    expect(getWorkerApplicationLabel(workers[1], '2026-08-01', 'existing')).toBeNull()
  })

  it('prevents selecting an active worker without a configured wage', () => {
    const wageMissing = { id: 'worker', isActive: true, isSelectable: false }
    expect(isWorkerOptionDisabled(wageMissing, '', new Set())).toBe(true)
    expect(getWorkerAvailabilityLabel(wageMissing)).toBe('시급 미설정 · 신규 선택 불가')
  })

  it('does not surface a demo/browser-only description for demo workers', () => {
    expect(getWorkerAvailabilityLabel({ id: 'demo-worker-01', isDemo: true })).toBeNull()
  })

  it('hides workers who cannot fill the position, but keeps an existing assignee', () => {
    const workers = [
      { id: 'scan-capable', positionIds: ['scan'] },
      { id: 'scan-incapable', positionIds: ['guide'] },
      { id: 'existing-incapable', positionIds: ['guide'] },
    ]

    expect(getWorkerOptionsForDate(workers, undefined, '', 'scan')).toEqual([workers[0]])
    expect(getWorkerOptionsForDate(workers, undefined, 'existing-incapable', 'scan')).toEqual([
      workers[0],
      workers[2],
    ])
  })
})
