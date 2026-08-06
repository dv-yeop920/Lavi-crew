import { describe, expect, it } from 'vitest'

import { reconcileDateDrafts, shouldConfirmDirtyNavigation } from './draft-reconciliation'

describe('reconcileDateDrafts', () => {
  it('removes only conflicts, preserves remaining drafts, and adds new disabled drafts', () => {
    const preserved = { date: '2026-08-08', isEnabled: true, note: 'keep me' }
    const result = reconcileDateDrafts(
      [{ date: '2026-08-01', isEnabled: true, note: 'conflict' }, preserved],
      ['2026-08-08', '2026-08-09'],
      (date) => ({ date, isEnabled: false, note: '' }),
    )
    expect(result).toEqual([preserved, { date: '2026-08-09', isEnabled: false, note: '' }])
    expect(result[0]).toBe(preserved)
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
