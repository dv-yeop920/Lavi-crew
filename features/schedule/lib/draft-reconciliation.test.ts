import { describe, expect, it } from 'vitest'

import {
  getCleanSentinelTransition,
  getDirtyHistoryPopstateMode,
  reconcileDateDrafts,
  shouldCollapseSentinelOnMount,
  shouldConfirmDirtyNavigation,
} from './draft-reconciliation'

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

describe('getDirtyHistoryPopstateMode', () => {
  it('distinguishes bypass, sentinel forward, and intercepted back transitions', () => {
    expect(
      getDirtyHistoryPopstateMode({
        isBypassing: true,
        isDirty: true,
        isTargetSentinel: false,
      }),
    ).toBe('allow')
    expect(
      getDirtyHistoryPopstateMode({
        isBypassing: false,
        isDirty: true,
        isTargetSentinel: true,
      }),
    ).toBe('arm-sentinel')
    expect(
      getDirtyHistoryPopstateMode({
        isBypassing: false,
        isDirty: true,
        isTargetSentinel: false,
      }),
    ).toBe('confirm-back')
  })
})

describe('clean sentinel collapse', () => {
  it('collapses A → B → dirty sentinel so the next Back reaches A', () => {
    const history = ['A', 'B', 'B:sentinel']
    let index = 2
    expect(
      getCleanSentinelTransition({
        hasActiveSentinel: true,
        isDirty: false,
        isTargetSentinel: true,
      }),
    ).toBe('collapse-current')
    index -= 1
    expect(history[index]).toBe('B')
    index -= 1
    expect(history[index]).toBe('A')
  })

  it('collapses a stale sentinel after clean remount without affecting a direct load', () => {
    const history = ['A', 'B', 'C:sentinel', 'D']
    let index = 3
    index -= 1
    expect(history[index]).toBe('C:sentinel')
    expect(shouldCollapseSentinelOnMount({ hasMarker: true, isDirty: false })).toBe(true)
    index -= 1
    expect(history[index]).toBe('B')
    index -= 1
    expect(history[index]).toBe('A')
    expect(shouldCollapseSentinelOnMount({ hasMarker: false, isDirty: false })).toBe(false)
  })
})
