import { describe, expect, it } from 'vitest'

import {
  DEMO_SCHEDULE_OVERLAY_VERSION,
  type DemoScheduleOverlayEntry,
  getDemoSchedulesForMonth,
  getDemoWorkerShifts,
  parseDemoScheduleOverlay,
  upsertDemoScheduleOverlay,
} from './demo-schedule-overlay'

const entry: DemoScheduleOverlayEntry = {
  assignments: [
    {
      isTraining: false,
      positionId: 'leader',
      positionName: '팀장',
      slotIndex: 0,
      workerId: 'actual-worker',
      workerName: '실제 지원자',
    },
  ],
  ceremonyCount: 2,
  date: '2099-02-07',
  endTime: '18:00',
  savedAt: '2099-01-01T00:00:00.000Z',
  startTime: '09:00',
}

describe('demo schedule overlay domain', () => {
  it('accepts only the current, structurally valid document version', () => {
    expect(parseDemoScheduleOverlay({ schedules: [entry], version: 1 })).not.toBeNull()
    expect(parseDemoScheduleOverlay({ schedules: [entry], version: 2 })).toBeNull()
    expect(
      parseDemoScheduleOverlay({ schedules: [{ ...entry, endTime: '08:00' }], version: 1 }),
    ).toBeNull()
  })

  it('upserts by date and gives database schedules precedence', () => {
    const document = upsertDemoScheduleOverlay(
      { schedules: [], version: DEMO_SCHEDULE_OVERLAY_VERSION },
      [entry],
    )
    expect(getDemoSchedulesForMonth(document, '2099-02', [])).toEqual([entry])
    expect(getDemoSchedulesForMonth(document, '2099-02', [entry.date])).toEqual([])
  })

  it('projects the actual worker assignment into the requested range', () => {
    const document = { schedules: [entry], version: DEMO_SCHEDULE_OVERLAY_VERSION }
    expect(
      getDemoWorkerShifts(document, {
        databaseDates: [],
        end: '2099-02-28',
        start: '2099-02-01',
        workerId: 'actual-worker',
      }),
    ).toMatchObject([{ date: entry.date, isDemo: true, positionName: '팀장' }])
  })
})
