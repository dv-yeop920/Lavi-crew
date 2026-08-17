import type { PositionId } from '@/shared/domain/positions'

export type ScheduleHistoryMonthSummary = {
  month: string // 'YYYY-MM'
  registeredDateCount: number
}

export type ScheduleHistoryRow = {
  ceremonyCount: number
  date: string // 'YYYY-MM-DD'
  endTime: string // 'HH:MM'
  positionAssignments: Record<PositionId, string[]> // worker display names per position, in slot order; training assignments suffixed with '(교육)'
  startTime: string // 'HH:MM'
  status: 'cancelled' | 'published'
}
