import { describe, expect, it } from 'vitest'

import {
  cancelDailyScheduleSchema,
  confirmAttendanceSchema,
  updateDailyScheduleSchema,
} from './daily-schedule'

const id = 'e2308f73-a094-4dd1-8505-e216d5c4fc68'
const version = '2026-07-29T00:00:00.000Z'

describe('daily schedule schemas', () => {
  it('requires an explicit cancellation reason', () => {
    expect(
      cancelDailyScheduleSchema.safeParse({
        expectedShiftUpdatedAt: version,
        reason: ' ',
        requestId: id,
        shiftId: id,
      }).success,
    ).toBe(false)
  })

  it('accepts a complete daily schedule update boundary', () => {
    expect(
      updateDailyScheduleSchema.safeParse({
        assignments: [],
        ceremonyCount: 5,
        endTime: '18:00',
        expectedShiftUpdatedAt: version,
        requestId: id,
        shiftId: id,
        startTime: '09:00',
      }).success,
    ).toBe(true)
  })

  it('requires actual times only for present attendance', () => {
    const base = {
      attendanceId: id,
      correctionReason: null,
      expectedAttendanceUpdatedAt: version,
      requestId: id,
    }
    expect(
      confirmAttendanceSchema.safeParse({
        ...base,
        actualEndedAt: null,
        actualStartedAt: null,
        status: 'present',
      }).success,
    ).toBe(false)
    expect(
      confirmAttendanceSchema.safeParse({
        ...base,
        actualEndedAt: null,
        actualStartedAt: null,
        status: 'absent',
      }).success,
    ).toBe(true)
  })
})
