export function createInviteCodeFromRequestId(requestId: string) {
  return `LAVI-${requestId.replaceAll('-', '').slice(0, 12).toUpperCase()}`
}
