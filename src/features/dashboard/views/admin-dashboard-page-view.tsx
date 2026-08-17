import { getAdminDashboardController } from '@/features/dashboard/controllers/admin-dashboard-controller'

import { AdminDashboardView } from './admin-dashboard-view'

export async function AdminDashboardPageView() {
  const viewModel = await getAdminDashboardController()
  return <AdminDashboardView viewModel={viewModel} />
}
