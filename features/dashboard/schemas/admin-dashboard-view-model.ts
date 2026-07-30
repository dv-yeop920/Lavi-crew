export type AdminDashboardViewModel = {
  applicationPeriod: {
    deadline: string
    effectiveStatus: 'closed' | 'effectively_closed' | 'open'
    id: string
    requiresClose: boolean
    status: 'closed' | 'open'
    updatedAt: string
    yearMonth: string
  } | null
  asOfDate: string
  currentMonth: {
    unregisteredWeekendCount: number
    yearMonth: string
  }
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
}
