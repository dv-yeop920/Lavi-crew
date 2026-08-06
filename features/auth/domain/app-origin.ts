export function getCanonicalAppOrigin(configuredUrl?: string) {
  const value = configuredUrl?.trim() || 'http://localhost:3000'
  const url = new URL(value)

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('NEXT_PUBLIC_APP_URL은 http 또는 https URL이어야 합니다.')
  }

  return url.origin
}
