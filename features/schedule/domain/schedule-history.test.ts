import { describe, expect, it } from 'vitest'

import {
  buildScheduleHistoryRows,
  getMonthDateRange,
  summarizeScheduleHistoryMonths,
} from './schedule-history'

describe('getMonthDateRange', () => {
  it('returns the first day of the given month and the next month', () => {
    expect(getMonthDateRange('2026-08')).toEqual({
      monthEndExclusive: '2026-09-01',
      monthStart: '2026-08-01',
    })
  })

  it('rolls over into the next calendar year across December', () => {
    expect(getMonthDateRange('2026-12')).toEqual({
      monthEndExclusive: '2027-01-01',
      monthStart: '2026-12-01',
    })
  })
})

describe('summarizeScheduleHistoryMonths', () => {
  it('groups work dates by month and sorts descending, counting every status', () => {
    expect(
      summarizeScheduleHistoryMonths([
        '2026-12-05',
        '2026-12-06',
        '2027-01-02',
        '2026-08-01',
        '2026-08-08',
        '2026-08-15',
      ]),
    ).toEqual([
      { month: '2027-01', registeredDateCount: 1 },
      { month: '2026-12', registeredDateCount: 2 },
      { month: '2026-08', registeredDateCount: 3 },
    ])
  })

  it('produces no entry for a month with zero shifts', () => {
    expect(summarizeScheduleHistoryMonths([])).toEqual([])
  })
})

describe('buildScheduleHistoryRows', () => {
  const workerNamesById = new Map([
    ['worker-1', '홍길동'],
    ['worker-2', '김철수'],
  ])

  it('includes only confirmed assignments, marks training, and falls back for unknown workers', () => {
    const rows = buildScheduleHistoryRows(
      [
        {
          ceremony_count: 2,
          end_time: '18:00:00',
          shift_assignments: [
            {
              is_training: false,
              position_id: 'leader',
              status: 'confirmed',
              worker_id: 'worker-1',
            },
            { is_training: true, position_id: 'scan', status: 'confirmed', worker_id: 'worker-2' },
            {
              is_training: false,
              position_id: 'main',
              status: 'cancelled',
              worker_id: 'worker-1',
            },
            {
              is_training: false,
              position_id: 'dress',
              status: 'confirmed',
              worker_id: 'worker-unknown',
            },
          ],
          start_time: '09:00:00',
          status: 'published' as const,
          work_date: '2026-08-08',
        },
      ],
      workerNamesById,
    )

    expect(rows).toEqual([
      {
        ceremonyCount: 2,
        date: '2026-08-08',
        endTime: '18:00',
        positionAssignments: {
          leader: ['홍길동'],
          scan: ['김철수(교육)'],
          main: [],
          dress: ['알 수 없음'],
          song: [],
          manager: [],
          guide: [],
          'waiting-room': [],
        },
        startTime: '09:00',
        status: 'published',
      },
    ])
  })

  it('sorts rows ascending by date regardless of input order', () => {
    const rows = buildScheduleHistoryRows(
      [
        {
          ceremony_count: 1,
          end_time: '18:00:00',
          shift_assignments: [],
          start_time: '09:00:00',
          status: 'published' as const,
          work_date: '2026-08-15',
        },
        {
          ceremony_count: 1,
          end_time: '18:00:00',
          shift_assignments: [],
          start_time: '09:00:00',
          status: 'cancelled' as const,
          work_date: '2026-08-01',
        },
      ],
      workerNamesById,
    )

    expect(rows.map((row) => row.date)).toEqual(['2026-08-01', '2026-08-15'])
  })

  it('excludes draft shifts', () => {
    const rows = buildScheduleHistoryRows(
      [
        {
          ceremony_count: 1,
          end_time: '18:00:00',
          shift_assignments: [],
          start_time: '09:00:00',
          status: 'draft',
          work_date: '2026-08-20',
        },
      ],
      workerNamesById,
    )

    expect(rows).toEqual([])
  })
})
