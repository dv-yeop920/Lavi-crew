import type { PositionId } from '@/shared/domain/positions'

export type DailyAttendanceViewModel = {
  actualEndedAt: string | null
  actualStartedAt: string | null
  confirmedAt: string | null
  correctionReason: string | null
  id: string
  status: 'absent' | 'pending' | 'present'
  updatedAt: string
}

export type DailyScheduleViewModel =
  | { date: string; state: 'invalid' | 'not-found' }
  | {
      assignments: Array<{
        attendance: DailyAttendanceViewModel | null
        id: string
        isTraining: boolean
        positionId: PositionId
        slotIndex: number
        status: 'cancelled' | 'confirmed' | 'draft'
        workerId: string
      }>
      canEditStructure: boolean
      date: string
      shift: {
        cancellationReason: string | null
        cancelledAt: string | null
        ceremonyCount: number
        endTime: string
        id: string
        startTime: string
        status: 'cancelled' | 'draft' | 'published'
        updatedAt: string
      }
      state: 'ready'
      workers: Array<{
        id: string
        isActive: boolean
        isSelectable: boolean
        name: string
        positionIds: PositionId[]
        summary: string
      }>
    }
