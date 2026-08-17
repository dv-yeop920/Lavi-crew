import { randomUUID } from 'node:crypto'

import { getInvitesController } from '../model/management-controller'

import { InviteManagementView } from './invite-management-view'

export async function InviteManagementPageView() {
  const invites = await getInvitesController()
  return (
    <InviteManagementView
      createRequestId={randomUUID()}
      invites={invites}
      deactivateRequestIds={Object.fromEntries(invites.map((invite) => [invite.id, randomUUID()]))}
    />
  )
}
