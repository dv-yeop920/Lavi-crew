export function getVerifiedUserId(claims: { sub?: unknown } | null | undefined) {
  return typeof claims?.sub === 'string' ? claims.sub : null
}
