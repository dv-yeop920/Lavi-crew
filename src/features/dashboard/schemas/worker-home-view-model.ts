export type WorkerHomeViewModel = {
  application: {
    appliedCount: number
    deadline: string
    periodId: string
    yearMonth: string
  } | null
  name: string
  nextShift: {
    assignmentId: string
    date: string
    endTime: string
    isTraining: boolean
    positionName: string
    shiftId: string
    startTime: string
  } | null
  notices: Array<{
    contentPreview: string
    createdAt: string
    id: string
    isPinned: boolean
    isRead: boolean
    title: string
  }>
}
