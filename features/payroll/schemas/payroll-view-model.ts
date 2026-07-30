export type WorkerPayrollViewModel = {
  averagePaidMonthAmount: number
  details: Array<{
    actualEndedAt: string
    actualStartedAt: string
    amount: number
    id: string
    overtimeMinutes: number
    positionName: string
    regularMinutes: number
    shiftId: string
    workDate: string
  }>
  month: string
  state: 'invalid' | 'ready'
  totalAmount: number
  weeks: Array<{
    amount: number
    coverage: 'full-week'
    end: string
    shiftCount: number
    start: string
    workedMinutes: number
  }>
}
