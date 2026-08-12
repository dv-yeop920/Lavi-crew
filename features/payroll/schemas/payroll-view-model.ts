export type WorkerPayrollViewModel = {
  averagePaidMonthAmount: number
  details: Array<{
    amount: number
    id: string
    overtimeMinutes: number
    positionName: string
    regularMinutes: number
    shiftEndTime: string
    shiftId: string
    shiftStartTime: string
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
