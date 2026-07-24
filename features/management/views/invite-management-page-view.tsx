import { getInvitesController } from '../controllers/management-controller'

import { InviteManagementView } from './invite-management-view'

export async function InviteManagementPageView() {
  const invites = await getInvitesController()
  return <InviteManagementView invites={invites} />
}
