import { getScheduleHistoryMonthDatesController } from '../model/schedule-history-controller'

import { AdminScheduleHistoryListView } from './admin-schedule-history-list-view'

export async function AdminScheduleHistoryListPageView() {
  const databaseWorkDates = await getScheduleHistoryMonthDatesController()
  return <AdminScheduleHistoryListView databaseWorkDates={databaseWorkDates} />
}
