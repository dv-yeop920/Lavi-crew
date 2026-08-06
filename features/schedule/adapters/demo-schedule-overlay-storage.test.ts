import { describe, expect, it, vi } from 'vitest'

import {
  EMPTY_DEMO_SCHEDULE_OVERLAY,
  readDemoScheduleOverlay,
  writeDemoScheduleOverlay,
} from './demo-schedule-overlay-storage'

describe('demo schedule overlay storage adapter', () => {
  it('falls back safely for malformed data and unavailable storage', () => {
    expect(readDemoScheduleOverlay({ getItem: () => '{broken' })).toEqual(
      EMPTY_DEMO_SCHEDULE_OVERLAY,
    )
    expect(
      readDemoScheduleOverlay({
        getItem: () => {
          throw new Error('blocked')
        },
      }),
    ).toEqual(EMPTY_DEMO_SCHEDULE_OVERLAY)
  })

  it('reports quota failures without throwing', () => {
    const setItem = vi.fn(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })
    expect(writeDemoScheduleOverlay({ setItem }, EMPTY_DEMO_SCHEDULE_OVERLAY).ok).toBe(false)
  })
})
