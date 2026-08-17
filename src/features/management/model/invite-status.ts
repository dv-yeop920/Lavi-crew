export type InviteStatus = 'active' | 'disabled' | 'exhausted' | 'expired'

export function getInviteStatus(
  invite: {
    expiresAt: string
    isActive: boolean
    maxUses: number
    usedCount: number
  },
  asOf = new Date(),
): InviteStatus {
  if (!invite.isActive) return 'disabled'
  if (invite.usedCount >= invite.maxUses) return 'exhausted'
  if (new Date(invite.expiresAt) <= asOf) return 'expired'
  return 'active'
}
