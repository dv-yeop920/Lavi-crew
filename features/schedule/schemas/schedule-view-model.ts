import type { PositionId } from '@/shared/domain/positions'

export type RegisteredScheduleSummary = {
  assignedCount: number
  ceremonyCount: number
  date: string
  time: string
}

export type AssignmentWorkerOption = {
  appliedDates: string[]
  id: string
  name: string
  positionIds: PositionId[]
  summary: string
}

export type MonthRegistrationViewModel = {
  hasScheduleHistory: boolean
  month: string
  period: {
    applicationDeadline: string | null
    canReopen: boolean
    closedReason: 'deadline' | 'manual' | null
    id: string | null
    status: 'closed' | 'open'
    updatedAt: string | null
  }
  registeredSchedules: RegisteredScheduleSummary[]
  unregisteredWeekendDates: string[]
  workers: AssignmentWorkerOption[]
}

export type WorkerMonthApplicationViewModel = {
  month: string
  period: {
    applicationDeadline: string
    closedReason: 'deadline' | 'manual' | null
    id: string
    status: 'closed' | 'open'
    updatedAt: string
  } | null
  selectedDates: string[]
}
