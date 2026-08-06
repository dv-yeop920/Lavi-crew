import type { WorkerScheduleMode } from '../domain/worker-read-models'

export type WorkerScheduleViewModel = {
  anchor: string
  mode: WorkerScheduleMode
  range: { end: string; start: string }
  shifts: Array<{
    assignmentId: string
    date: string
    endTime: string
    isTraining: boolean
    isDemo?: boolean
    positionId: string
    positionName: string
    shiftId: string
    startTime: string
  }>
  state: 'invalid' | 'ready'
  workerId: string
}
