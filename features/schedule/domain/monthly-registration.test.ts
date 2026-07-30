import { describe, expect, it } from 'vitest'

import {
  createRegistrationSummary,
  getPublishedScheduleSummaries,
  getUnregisteredWeekendDates,
  type ScheduleInput,
  validateMonthlyRegistration,
} from './monthly-registration'

const workers = Array.from(
  { length: 12 },
  (_, index) => `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
)

function validSchedule(): ScheduleInput {
  let workerIndex = 0
  return {
    assignments: [
      ['leader', 1],
      ['scan', 1],
      ['main', 1],
      ['dress', 1],
      ['song', 1],
      ['manager', 2],
      ['guide', 2],
      ['waiting-room', 1],
    ].flatMap(([positionId, count]) =>
      Array.from({ length: Number(count) }, (_, slotIndex) => ({
        isTraining: false,
        positionId: String(positionId),
        slotIndex,
        slotKind: 'base' as const,
        workerId: workers[workerIndex++],
      })),
    ),
    ceremonyCount: 1,
    endTime: '18:00',
    startTime: '09:00',
    workDate: '2026-08-01',
  }
}

describe('validateMonthlyRegistration', () => {
  it('accepts all eight positions with their exact base capacities', () => {
    expect(validateMonthlyRegistration('2026-08', [validSchedule()])).toEqual([])
  })

  it('rejects a weekday outside the target weekend policy', () => {
    const schedule = validSchedule()
    schedule.workDate = '2026-08-03'
    expect(validateMonthlyRegistration('2026-08', [schedule])).toContainEqual(
      expect.objectContaining({ code: 'INVALID_DATE' }),
    )
  })

  it('rejects a duplicate worker on the same date', () => {
    const schedule = validSchedule()
    schedule.assignments[1].workerId = schedule.assignments[0].workerId
    expect(validateMonthlyRegistration('2026-08', [schedule])).toContainEqual(
      expect.objectContaining({ code: 'DUPLICATE_WORKER' }),
    )
  })

  it('allows one training-only extra slot and rejects a non-training extra', () => {
    const schedule = validSchedule()
    schedule.assignments.push({
      isTraining: true,
      positionId: 'leader',
      slotIndex: 1,
      slotKind: 'extra-training',
      workerId: workers[10],
    })
    expect(validateMonthlyRegistration('2026-08', [schedule])).toEqual([])

    schedule.assignments.at(-1)!.isTraining = false
    expect(validateMonthlyRegistration('2026-08', [schedule])).toContainEqual(
      expect.objectContaining({ code: 'EXTRA_SLOT_MUST_BE_TRAINING' }),
    )
  })

  it('rejects missing base slots and invalid work times', () => {
    const schedule = validSchedule()
    schedule.assignments = schedule.assignments.filter(
      (assignment) => !(assignment.positionId === 'manager' && assignment.slotIndex === 1),
    )
    schedule.endTime = schedule.startTime
    const errors = validateMonthlyRegistration('2026-08', [schedule])
    expect(errors).toContainEqual(expect.objectContaining({ code: 'INVALID_CAPACITY' }))
    expect(errors).toContainEqual(expect.objectContaining({ code: 'INVALID_TIME' }))
    expect(errors).toContainEqual({
      code: 'INVALID_TIME',
      path: 'dates.2026-08-01.endTime',
    })
  })
})

describe('monthly schedule registration view rules', () => {
  it('excludes every existing shift date including cancelled history', () => {
    expect(getUnregisteredWeekendDates('2026-08', ['2026-08-01', '2026-08-02'])).not.toContain(
      '2026-08-01',
    )
    expect(getUnregisteredWeekendDates('2026-08', ['2026-08-01', '2026-08-02'])).not.toContain(
      '2026-08-02',
    )
  })

  it('summarizes dates, assignments, and training assignments before confirmation', () => {
    const schedule = validSchedule()
    schedule.assignments[0].isTraining = true
    expect(createRegistrationSummary([schedule])).toEqual({
      assignmentCount: 10,
      dateCount: 1,
      trainingCount: 1,
    })
  })

  it('counts only confirmed assignments without dropping the published shift', () => {
    expect(
      getPublishedScheduleSummaries([
        {
          ceremony_count: 2,
          end_time: '18:00:00',
          shift_assignments: [
            { id: 'confirmed', status: 'confirmed' },
            { id: 'cancelled', status: 'cancelled' },
          ],
          start_time: '09:00:00',
          status: 'published',
          work_date: '2026-08-01',
        },
      ]),
    ).toEqual([
      {
        assignedCount: 1,
        ceremonyCount: 2,
        date: '2026-08-01',
        time: '09:00–18:00',
      },
    ])
  })
})
