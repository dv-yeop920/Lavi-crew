export type WorkerNoticeViewModel = {
  notices: Array<{
    content: string
    createdAt: string
    id: string
    isDemo: boolean
    isPinned: boolean
    isRead: boolean
    title: string
    updatedAt: string
  }>
}

export type AdminNoticeViewModel = {
  activeWorkerCount: number
  notices: Array<{
    activeWorkerCount: number
    content: string
    createdAt: string
    id: string
    isDemo: boolean
    isPinned: boolean
    readCount: number
    title: string
    updatedAt: string
  }>
}
