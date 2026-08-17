import type { PositionId } from '@/shared/domain/positions'

export type DailyScheduleViewModel =
  | { date: string; state: 'invalid' | 'not-found' }
  | {
      assignments: Array<{
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
        appliedDates: string[]
        id: string
        isActive: boolean
        isSelectable: boolean
        name: string
        positionIds: PositionId[]
        summary: string
      }>
    }
