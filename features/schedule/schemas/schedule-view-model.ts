import type { PositionId } from '@/shared/domain/positions'

export type RegisteredScheduleSummary = {
  assignedCount: number
  cancellationReason: string | null
  ceremonyCount: number
  date: string
  status: 'cancelled' | 'published'
  time: string
  isDemo?: boolean
  isDraft?: boolean
}

export type AssignmentWorkerOption = {
  appliedDates: string[]
  id: string
  isDemo: boolean
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
