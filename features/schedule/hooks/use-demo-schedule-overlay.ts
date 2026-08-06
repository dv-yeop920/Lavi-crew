'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  EMPTY_DEMO_SCHEDULE_OVERLAY,
  readDemoScheduleOverlay,
  writeDemoScheduleOverlay,
} from '../adapters/demo-schedule-overlay-storage'
import {
  type DemoScheduleOverlayEntry,
  upsertDemoScheduleOverlay,
} from '../domain/demo-schedule-overlay'

export function useDemoScheduleOverlay(enabled: boolean) {
  const [document, setDocument] = useState(EMPTY_DEMO_SCHEDULE_OVERLAY)

  useEffect(() => {
    if (!enabled) return
    let isCancelled = false
    queueMicrotask(() => {
      if (!isCancelled) setDocument(readDemoScheduleOverlay(window.localStorage))
    })
    return () => {
      isCancelled = true
    }
  }, [enabled])

  const save = useCallback(
    (entries: DemoScheduleOverlayEntry[]) => {
      if (!enabled) {
        return { message: '데모 표시 기능이 꺼져 있습니다.', ok: false as const }
      }
      const current = readDemoScheduleOverlay(window.localStorage)
      const next = upsertDemoScheduleOverlay(current, entries)
      const result = writeDemoScheduleOverlay(window.localStorage, next)
      if (result.ok) setDocument(next)
      return result
    },
    [enabled],
  )

  return { document, save }
}
