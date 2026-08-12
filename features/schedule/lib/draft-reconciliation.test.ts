import { describe, expect, it } from 'vitest'

import { reconcileDateDrafts, shouldConfirmDirtyNavigation } from './draft-reconciliation'

describe('reconcileDateDrafts', () => {
  it('removes only untouched conflicts, preserves remaining drafts, and adds new disabled drafts', () => {
    const preserved = { date: '2026-08-08', isEnabled: true, note: 'keep me' }
    const result = reconcileDateDrafts(
      [{ date: '2026-08-01', isEnabled: false, note: 'conflict' }, preserved],
      ['2026-08-08', '2026-08-09'],
      (date) => ({ date, isEnabled: false, note: '' }),
    )
    expect(result).toEqual([preserved, { date: '2026-08-09', isEnabled: false, note: '' }])
    expect(result[0]).toBe(preserved)
  })

  it('never drops an in-progress (isEnabled) draft even when its date falls out of nextDates', () => {
    const inProgress = { date: '2026-08-01', isEnabled: true, note: 'being edited' }
    const stillListed = { date: '2026-08-08', isEnabled: false, note: '' }
    const result = reconcileDateDrafts(
      [inProgress, stillListed],
      ['2026-08-08', '2026-08-09'],
      (date) => ({ date, isEnabled: false, note: '' }),
    )
    expect(result).toEqual([
      inProgress,
      stillListed,
      { date: '2026-08-09', isEnabled: false, note: '' },
    ])
    expect(result[0]).toBe(inProgress)
    expect(result[1]).toBe(stillListed)
  })

  it('returns the same reference when nothing actually changes', () => {
    const current = [{ date: '2026-08-08', isEnabled: false, note: '' }]
    const result = reconcileDateDrafts(current, ['2026-08-08'], (date) => ({
      date,
      isEnabled: false,
      note: '',
    }))
    expect(result).toBe(current)
  })
})

describe('shouldConfirmDirtyNavigation', () => {
  it('only confirms dirty internal navigation to another URL', () => {
    expect(shouldConfirmDirtyNavigation(true, '/admin/schedules', '/admin/schedules/new')).toBe(
      true,
    )
    expect(shouldConfirmDirtyNavigation(false, '/admin/schedules', '/admin/schedules/new')).toBe(
      false,
    )
    expect(shouldConfirmDirtyNavigation(true, '/admin/schedules/new', '/admin/schedules/new')).toBe(
      false,
    )
    expect(
      shouldConfirmDirtyNavigation(
        true,
        '/schedule/apply?month=2026-09',
        '/schedule/apply?month=2026-08',
      ),
    ).toBe(true)
  })
})
