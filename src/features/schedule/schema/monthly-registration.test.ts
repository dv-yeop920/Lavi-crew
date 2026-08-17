import { describe, expect, it } from 'vitest'

import {
  getMonthlyRegistrationFieldErrors,
  parseMonthlyRegistrationFormData,
} from './monthly-registration'

describe('parseMonthlyRegistrationFormData', () => {
  it('parses the JSON boundary without trusting additional fields', () => {
    const formData = new FormData()
    formData.set(
      'payload',
      JSON.stringify({
        applicationDeadlineDate: '2026-07-25',
        applicationDeadlineTime: '18:00',
        expectedPeriodUpdatedAt: null,
        month: '2026-08',
        requestId: '00000000-0000-4000-8000-000000000001',
        schedules: [
          {
            assignments: [
              {
                isTraining: false,
                positionId: 'leader',
                slotIndex: 0,
                slotKind: 'base',
                workerId: '00000000-0000-4000-8000-000000000002',
              },
            ],
            ceremonyCount: 1,
            endTime: '18:00',
            startTime: '09:00',
            workDate: '2026-08-01',
          },
        ],
        wage: 999999,
      }),
    )
    const result = parseMonthlyRegistrationFormData(formData)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).not.toHaveProperty('wage')
  })

  it('rejects malformed JSON and invalid month/deadline values', () => {
    const malformed = new FormData()
    malformed.set('payload', '{')
    expect(parseMonthlyRegistrationFormData(malformed).success).toBe(false)

    const invalid = new FormData()
    invalid.set(
      'payload',
      JSON.stringify({
        applicationDeadlineDate: 'bad',
        applicationDeadlineTime: '99:99',
        expectedPeriodUpdatedAt: null,
        month: '2026-13',
        requestId: 'bad',
        schedules: [],
      }),
    )
    expect(parseMonthlyRegistrationFormData(invalid).success).toBe(false)
  })

  it('rejects a ceremony count greater than ten', () => {
    const formData = new FormData()
    formData.set(
      'payload',
      JSON.stringify({
        applicationDeadlineDate: '2026-07-25',
        applicationDeadlineTime: '18:00',
        expectedPeriodUpdatedAt: null,
        month: '2026-08',
        requestId: '00000000-0000-4000-8000-000000000001',
        schedules: [
          {
            assignments: [],
            ceremonyCount: 11,
            endTime: '18:00',
            startTime: '09:00',
            workDate: '2026-08-01',
          },
        ],
      }),
    )
    expect(parseMonthlyRegistrationFormData(formData).success).toBe(false)
  })

  it('keeps nested assignment paths for accessible field errors', () => {
    const formData = new FormData()
    formData.set(
      'payload',
      JSON.stringify({
        applicationDeadlineDate: '2026-07-25',
        applicationDeadlineTime: '18:00',
        expectedPeriodUpdatedAt: null,
        month: '2026-08',
        requestId: '00000000-0000-4000-8000-000000000001',
        schedules: [
          {
            assignments: [
              {
                isTraining: false,
                positionId: 'leader',
                slotIndex: 0,
                slotKind: 'base',
                workerId: '',
              },
            ],
            ceremonyCount: 1,
            endTime: '18:00',
            startTime: '09:00',
            workDate: '2026-08-01',
          },
        ],
      }),
    )
    const result = parseMonthlyRegistrationFormData(formData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(getMonthlyRegistrationFieldErrors(result.error, formData)).toHaveProperty(
        'dates.2026-08-01.positions.leader.slots.0.workerId',
      )
    }
  })
})
