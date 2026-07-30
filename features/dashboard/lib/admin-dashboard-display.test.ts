import { describe, expect, it } from 'vitest'

import type { AdminDashboardViewModel } from '../schemas/admin-dashboard-view-model'

import { getAdminDashboardTasks } from './admin-dashboard-display'

const baseViewModel: AdminDashboardViewModel = {
  applicationPeriod: null,
  asOfDate: '2026-07-30',
  currentMonth: { unregisteredWeekendCount: 2, yearMonth: '2026-07' },
  currentWeek: { endExclusive: '2026-08-03', schedules: [], start: '2026-07-27' },
}

describe('admin dashboard display', () => {
  it('creates real setup and unregistered schedule tasks', () => {
    expect(getAdminDashboardTasks(baseViewModel)).toEqual([
      {
        href: '/admin/schedules/new?month=2026-07',
        label: '2026년 7월 신청 기간 설정',
        status: '미설정',
        tone: 'warning',
      },
      {
        href: '/admin/schedules/new?month=2026-07',
        label: '2026년 7월 스케줄 등록 필요',
        status: '2일',
        tone: 'accent',
      },
    ])
  })

  it('shows an expired open period as requiring close', () => {
    expect(
      getAdminDashboardTasks({
        ...baseViewModel,
        applicationPeriod: {
          deadline: '2026-07-29T15:00:00Z',
          effectiveStatus: 'effectively_closed',
          id: 'period',
          requiresClose: true,
          status: 'open',
          updatedAt: '2026-07-29T15:00:00Z',
          yearMonth: '2026-07-01',
        },
        currentMonth: { ...baseViewModel.currentMonth, unregisteredWeekendCount: 0 },
      }),
    ).toMatchObject([{ status: '기한 종료', tone: 'warning' }])
  })
})
