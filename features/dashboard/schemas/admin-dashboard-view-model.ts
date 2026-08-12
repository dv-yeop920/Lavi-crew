export type AdminDashboardMonth = {
  applicationPeriod: {
    deadline: string
    effectiveStatus: 'closed' | 'effectively_closed' | 'open'
    id: string
    requiresClose: boolean
    status: 'closed' | 'open'
    updatedAt: string
    yearMonth: string
  } | null
  unregisteredWeekendCount: number
  yearMonth: string
}

export type AdminDashboardViewModel = {
  asOfDate: string
  currentWeek: {
    endExclusive: string
    schedules: Array<{
      assignedWorkerCount: number
      ceremonyCount: number
      date: string
      endTime: string
      id: string
      startTime: string
    }>
    start: string
  }
  /** 이번 달과 다음 달 순서. 신청 기간은 전달에 미리 여므로 두 달을 함께 보여준다. */
  months: AdminDashboardMonth[]
}
