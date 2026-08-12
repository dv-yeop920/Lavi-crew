import { getScheduleHistoryMonthDatesController } from '../controllers/schedule-history-controller'

import { AdminScheduleHistoryListView } from './admin-schedule-history-list-view'

export async function AdminScheduleHistoryListPageView() {
  const databaseWorkDates = await getScheduleHistoryMonthDatesController()
  return <AdminScheduleHistoryListView databaseWorkDates={databaseWorkDates} />
}
