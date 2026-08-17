import { getAdminDashboardController } from '@/features/dashboard/model/admin-dashboard-controller'

import { AdminDashboardView } from './admin-dashboard-view'

export async function AdminDashboardPageView() {
  const viewModel = await getAdminDashboardController()
  return <AdminDashboardView viewModel={viewModel} />
}
