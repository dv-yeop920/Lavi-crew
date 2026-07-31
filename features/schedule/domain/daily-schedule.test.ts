import { describe, expect, it } from 'vitest'

import {
  getActiveDailyAssignments,
  getDailyScheduleAssignments,
  getDailyWorkerCandidates,
} from './daily-schedule'

describe('daily schedule active records', () => {
  it('excludes cancelled assignment history from the active set', () => {
    expect(
      getActiveDailyAssignments([
        { id: 'active', status: 'confirmed' as const },
        { id: 'history', status: 'cancelled' as const },
      ]),
    ).toEqual([{ id: 'active', status: 'confirmed' }])
  })

  it('keeps inactive current assignees visible but not selectable', () => {
    expect(
      getDailyWorkerCandidates(
        [
          { hourly_wage: 12000, id: 'current-inactive', is_active: false },
          { hourly_wage: 12000, id: 'active', is_active: true },
          { hourly_wage: 12000, id: 'unrelated-inactive', is_active: false },
          { hourly_wage: 0, id: 'wage-missing', is_active: true },
        ],
        new Set(['current-inactive']),
      ),
    ).toEqual([
      {
        hourly_wage: 12000,
        id: 'current-inactive',
        is_active: false,
        isSelectable: false,
      },
      { hourly_wage: 12000, id: 'active', is_active: true, isSelectable: true },
      { hourly_wage: 0, id: 'wage-missing', is_active: true, isSelectable: false },
    ])
  })

  it('shows only the latest cancelled assignment revision for each slot', () => {
    expect(
      getDailyScheduleAssignments(
        [
          {
            id: 'older',
            position_id: 'leader',
            slot_index: 0,
            status: 'cancelled',
            updated_at: '2026-08-01T09:00:00Z',
          },
          {
            id: 'latest',
            position_id: 'leader',
            slot_index: 0,
            status: 'cancelled',
            updated_at: '2026-08-01T10:00:00Z',
          },
        ],
        'cancelled',
      ),
    ).toEqual([expect.objectContaining({ id: 'latest' })])
  })
})
