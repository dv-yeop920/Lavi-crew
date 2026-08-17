import { describe, expect, it } from 'vitest'

import type {
  AdminDashboardMonth,
  AdminDashboardViewModel,
} from '../schemas/admin-dashboard-view-model'

import { getAdminDashboardTasks } from './admin-dashboard-display'

const currentMonth: AdminDashboardMonth = {
  applicationPeriod: null,
  yearMonth: '2026-07',
}

const baseViewModel: AdminDashboardViewModel = {
  asOfDate: '2026-07-30',
  currentWeek: { endExclusive: '2026-08-03', schedules: [], start: '2026-07-27' },
  months: [currentMonth],
}

describe('admin dashboard display', () => {
  it('creates application period setup task when period is not set', () => {
    expect(getAdminDashboardTasks(baseViewModel)).toEqual([
      {
        href: '/admin/schedules?month=2026-07',
        label: '2026년 7월 신청 기간 설정',
        status: '미설정',
        tone: 'warning',
      },
    ])
  })

  it('shows an expired open period as requiring close', () => {
    expect(
      getAdminDashboardTasks({
        ...baseViewModel,
        months: [
          {
            applicationPeriod: {
              deadline: '2026-07-29T15:00:00Z',
              effectiveStatus: 'effectively_closed',
              id: 'period',
              requiresClose: true,
              status: 'open',
              updatedAt: '2026-07-29T15:00:00Z',
              yearMonth: '2026-07-01',
            },
            yearMonth: '2026-07',
          },
        ],
      }),
    ).toMatchObject([
      { href: '/admin/schedules?month=2026-07', status: '기한 종료', tone: 'warning' },
    ])
  })

  it('lists next month tasks after the current month so a pre-opened period stays visible', () => {
    const tasks = getAdminDashboardTasks({
      ...baseViewModel,
      months: [
        currentMonth,
        {
          applicationPeriod: {
            deadline: '2026-08-25T09:00:00Z',
            effectiveStatus: 'open',
            id: 'next-period',
            requiresClose: false,
            status: 'open',
            updatedAt: '2026-07-30T00:00:00Z',
            yearMonth: '2026-08-01',
          },
          yearMonth: '2026-08',
        },
      ],
    })

    expect(tasks.map((task) => [task.label, task.href])).toEqual([
      ['2026년 7월 신청 기간 설정', '/admin/schedules?month=2026-07'],
      ['2026년 8월 신청 마감 예정', '/admin/schedules?month=2026-08'],
    ])
  })

  it('returns no tasks when both months are fully handled', () => {
    expect(
      getAdminDashboardTasks({
        ...baseViewModel,
        months: [
          {
            applicationPeriod: {
              deadline: '2026-06-25T09:00:00Z',
              effectiveStatus: 'closed',
              id: 'current',
              requiresClose: false,
              status: 'closed',
              updatedAt: '2026-06-25T09:00:00Z',
              yearMonth: '2026-07-01',
            },
            yearMonth: '2026-07',
          },
          {
            applicationPeriod: {
              deadline: '2026-07-25T09:00:00Z',
              effectiveStatus: 'closed',
              id: 'next',
              requiresClose: false,
              status: 'closed',
              updatedAt: '2026-07-25T09:00:00Z',
              yearMonth: '2026-08-01',
            },
            yearMonth: '2026-08',
          },
        ],
      }),
    ).toEqual([])
  })
})
