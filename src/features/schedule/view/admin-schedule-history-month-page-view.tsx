import { getScheduleHistoryForMonthController } from '../model/schedule-history-controller'

import { AdminScheduleHistoryMonthView } from './admin-schedule-history-month-view'

export async function AdminScheduleHistoryMonthPageView({ month }: { month: string }) {
  const rows = await getScheduleHistoryForMonthController(month)
  return <AdminScheduleHistoryMonthView month={month} rows={rows} />
}
